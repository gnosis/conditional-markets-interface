import Decimal from "decimal.js-light";

const sortBy = key => (a, b) => {
  if (a[key] == b[key]) {
    return 0;
  }

  return a[key] >= b[key] ? 1 : -1;
};

const prepareQueryData = (
  marketsFromConfig,
  queryData,
  { marketMakerAddress: targetLmsrAddress, positionBalances, funding }
) => {
  const marketTradesForMarketMaker = queryData.outcomeTokenTrades.filter(
    ({ marketMaker }) =>
      marketMaker.toLowerCase() === targetLmsrAddress.toLowerCase()
  );

  // these trade information will be put into all markets, basically assuming theres only one market currently
  // todo: only match to markets whose outcomeIndices were purchased or sold
  const trades = marketTradesForMarketMaker
    .sort(sortBy("blockTimestamp"))
    .map(({ marketMakerMarginalPrices, blockTimestamp }) => {
      const total = marketMakerMarginalPrices.reduce(
        (acc, numString) => acc.add(numString),
        new Decimal(0)
      );

      // change this to return multiple probabilities in the future to display various categorical
      const longProbability = new Decimal(marketMakerMarginalPrices[1]).div(
        total
      );
      return {
        value: longProbability,
        date: blockTimestamp * 1000 // the-graph time is seconds, js requires ms
      };
    });

  const markets = marketsFromConfig.map(
    ({ lowerBound, upperBound, ...market }) => ({
      lowerBound,
      upperBound,
      ...market,
      trades: trades.map(({ value, date }, index) => ({
        value: value
          .mul(upperBound - lowerBound)
          .add(lowerBound)
          .toNumber(),
        index,
        date
      }))
    })
  );

  return markets;
};

export default prepareQueryData;
