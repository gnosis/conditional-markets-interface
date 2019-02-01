import web3 from "web3";

const { BN, toBN } = web3.utils;

const DECIMAL_MULTIPLIER = toBN(10).pow(toBN(10));

export const resolveProbabilities = (pricesPerMarket, assumptions) => {
  console.log(JSON.stringify(pricesPerMarket));
  const fundingSum = pricesPerMarket
    .flat()
    .reduce(
      (acc, marketOutcomePrices) => acc.add(new BN(marketOutcomePrices)),
      new BN(0)
    );

  console.log(fundingSum.toString());

  // All outcomes we receive from the LMSR Contract are Outcome _PAIRS_
  // To "untangle" these pairs, we need to use Bayes Theorem like follows:
  // P(Outcome) = P(OutcomePair) + P(OtherOutcomePair...) + ...
  const probabilitiesUntangled = pricesPerMarket
    // Calculate all Outcome Pairs sumed with all other outcome pairs
    .map((marketPrices, marketIndex) => {
      return marketPrices.map(outcomePrice => {
        let sum = new BN(outcomePrice);

        pricesPerMarket.forEach((otherMarket, otherMarketIndex) => {
          if (marketIndex !== otherMarketIndex) {
            otherMarket.forEach(otherOutcome => {
              const outcomeProbability = new BN(otherOutcome);

              console.log(
                `${marketIndex} => ${otherMarketIndex} => `,
                sum.toString()
              );
              sum = sum.add(outcomeProbability);
            });
          }
        });
        // Take the sum for probabilities and divide by the decimal multiplier,
        // used to ensure decimal precision when working with BigNumber, which
        // handles only integers.
        const sumWithPrecisionRetained = (sum
          .mul(DECIMAL_MULTIPLIER)
          .div(fundingSum)
          .toNumber() / Math.pow(10, 10))
        return (
          sumWithPrecisionRetained
        );
      });
    });

    console.log(JSON.stringify(probabilitiesUntangled, null, 2))

    // divide all probabilities by the sum of all probabilities
    const probabilitiesNormalized = probabilitiesUntangled.map((marketProbabilities) => {
      const marketProbabilitySum = marketProbabilities.reduce((acc, num) => acc + num, 0)
      return marketProbabilities.map((probability) => probability / marketProbabilitySum)
    })

    return probabilitiesNormalized
};
