import Decimal from "decimal.js-light";

const sortBy = key => (a, b) => {
  if (a[key] == b[key]) {
    return 0;
  }

  return a[key] >= b[key] ? 1 : -1;
};

const prepareTradesData = (
  { lowerBound, upperBound, type },
  queryData,
  targetLmsrAddress
) => {
  const marketTradesForMarketMaker = queryData.outcomeTokenTrades.filter(
    ({ marketMaker }) =>
      marketMaker.toLowerCase() === targetLmsrAddress.toLowerCase()
  );

  // these trade information will be put into all markets, basically assuming theres only one market currently
  // todo: only match to markets whose outcomeIndices were purchased or sold
  const trades = marketTradesForMarketMaker
    .sort(sortBy("blockTimestamp"))
    .map(({ marketMakerMarginalPrices, blockTimestamp }, index) => {
      const total = marketMakerMarginalPrices.reduce(
        (acc, numString) => acc.add(numString),
        new Decimal(0)
      );

      let outcomesProbability = [];
      if (type === "SCALAR") {
        // In scalar market we use 1 value to get long probability price
        const longProbability = new Decimal(marketMakerMarginalPrices[1]).div(
          total
        );

        outcomesProbability = [
          longProbability
            .mul(upperBound - lowerBound)
            .add(lowerBound)
            .toNumber()
        ];
      } else if (type === "CATEGORICAL") {
        // This returns an array with the probability for each outcome
        outcomesProbability = marketMakerMarginalPrices.map(result => {
          return new Decimal(result)
            .div(total)
            .mul(100)
            .toNumber();
        });
      }

      return {
        index,
        outcomesProbability,
        date: blockTimestamp * 1000 // the-graph time is seconds, js requires ms
      };
    });

  return trades;
};

export default prepareTradesData;
