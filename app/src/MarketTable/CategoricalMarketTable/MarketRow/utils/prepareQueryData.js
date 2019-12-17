import Decimal from "decimal.js-light";

const sortBy = key => (a, b) => {
  if (a[key] == b[key]) {
    return 0;
  }

  return a[key] >= b[key] ? 1 : -1;
};

const prepareQueryData = (marketsFromConfig, queryData, lmsrAddress) => {
  const marketTradesForMarketMaker = queryData.outcomeTokenTrades.filter(
    ({ marketMaker }) => marketMaker.toLowerCase() === lmsrAddress.toLowerCase()
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

      // TODO change this to return multiple probabilities in the future to display various categorical
      // const longProbability = new Decimal(marketMakerMarginalPrices[1])
      //   .div(total)
      //   .toNumber();

      // This returns an array with the probability for each outcome
      const outcomesProbability = marketMakerMarginalPrices.map(result => {
        return new Decimal(result).div(total).mul(100).toNumber();
      });

      return {
        outcomesProbability,
        date: blockTimestamp * 1000 // the-graph time is seconds, js requires ms
      };
    });

  return trades;

  // const markets = marketsFromConfig.map(
  //   ({ lowerBound, upperBound, ...market }) => ({
  //     lowerBound,
  //     upperBound,
  //     ...market,
  //     trades: trades.map(({ value, date }, index) => ({
  //       value: value * (upperBound - lowerBound) + lowerBound,
  //       index,
  //       date
  //     }))
  //   })
  // );
  //
  // return markets;
};

export default prepareQueryData;
