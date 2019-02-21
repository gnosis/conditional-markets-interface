import Decimal from "decimal.js";

/**
 * Cartesian product generator for outcome titles in the format of [[A, B], [X, Y], [I, J]]. It will generate all possible generations, starting from the very left
 * and working it's way *up* the tree, i.e. looking similar to: A&X&I, A&X&J, A&Y&I, A&Y&J, etc. This behaviour is equal in the smart contract.
 *
 * @param {String[]} head - First group of outcome names
 * @param  {...String[]} tail - All remaining groups of outcome names
 * @generator
 */
function* cartesian(head, ...tail) {
  for (const h of head) {
    const remainder = tail.length > 0 ? cartesian(...tail) : [[]];
    for (const r of remainder) yield [h, ...r];
  }
}

const MARKET_IDS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Generates a naming scheme for all markets and all outcomes, e.g. Ay, An, By, Bn, C1, C2, C3, etc
 *
 * @param {Number[]} marketOutcomeCounts - Amount of outcomes in each market from the LMSR
 */
export const nameMarketOutcomes = marketOutcomeCounts => {
  const outcomeNames = marketOutcomeCounts.map((marketOutcomes, marketIndex) =>
    Array(marketOutcomes)
      .fill()
      .map((_, outcomeIndex) => {
        if (marketOutcomes === 2) {
          return `${MARKET_IDS[marketIndex]}${outcomeIndex === 0 ? "y" : "n"}`;
        } else {
          return `${MARKET_IDS[marketIndex]}${outcomeIndex + 1}`;
        }
      })
  );

  return outcomeNames;
};

/**
 * Generates all possible combinations of all market outcomes
 *
 * @param {String[[]]} marketOutcomeNames - Unique names for all outcomes in all Markets
 */
export const nameOutcomePairs = marketOutcomeNames => {
  //const atomicOutcomeCount = marketOutcomeNames.reduce((acc, outcomeNames) => acc *= outcomeNames.length, 1)
  let sets = [...cartesian(...marketOutcomeNames)].map(set => set.join("&"));

  return sets;
};

/**
 * Calculates all individiual outcome probabilities, based on the marginal prices of all outcome combinations and optional assumptions.
 *
 * @param {String[]} atomicOutcomePrices - Marginal prices for all atomic outcomes
 * @param {Number[]} marketOutcomeCounts - Amount of outcomes in each market
 * @param {Number[]} assumedOutcomeIndexes - Outcome indexes that should be treated as "assumed" or "conditions"
 */
export const getIndividualProbabilities = (
  atomicOutcomePrices,
  marketOutcomeCounts,
  assumedOutcomeIndexes,
) => {
  console.log(atomicOutcomePrices)
  const outcomeIdNames = nameMarketOutcomes(marketOutcomeCounts);
  const outcomePairNames = nameOutcomePairs(outcomeIdNames);

  // sum of all prices assuming outcomeIndex
  const assumedOutcomesPriceSum = atomicOutcomePrices.reduce(
    (acc, price, index) => {
      const outcomePair = outcomePairNames[index];
      const idsInOutcomePair = outcomePair.split("&");
      const hasAllAssumedOutcomesInPair = assumedOutcomeIndexes.every(
        outcomeIndex =>
          idsInOutcomePair.includes(outcomeIdNames.flat()[outcomeIndex])
      );
      if (hasAllAssumedOutcomesInPair) {
        return acc.add(new Decimal(price));
      }
      return acc;
    },
    new Decimal(0)
  );

  const individualProbabilities = outcomeIdNames.map((marketIds, marketIndex) =>
    marketIds.map((outcomeId, outcomeIndex) => {
      const sum = outcomePairNames.reduce((acc, outcomePair, outcomePairIndex) => {
        const idsInOutcomePair = outcomePair.split("&");

        const hasAllAssumedOutcomesInPair = assumedOutcomeIndexes.every(
          outcomeIndex =>
            idsInOutcomePair.includes(outcomeIdNames.flat()[outcomeIndex])
        );

        if (idsInOutcomePair.includes(outcomeId) && hasAllAssumedOutcomesInPair) {
          return acc.add(new Decimal(atomicOutcomePrices[outcomePairIndex]));
        }
        return acc;
      }, new Decimal(0));

      return sum.div(assumedOutcomesPriceSum).toNumber();
    })
  );

  return individualProbabilities;
};
