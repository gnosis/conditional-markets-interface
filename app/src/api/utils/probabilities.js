import Decimal from "decimal.js";

const sumAndTakePercentage = priceGroups => {
  const sum = priceGroups
    .flat()
    .reduce(
      (acc, priceGroup) => acc.add(new Decimal(priceGroup)),
      new Decimal(0)
    );

  const asPercentage = priceGroups.map(priceGroup =>
    priceGroup.map(price => new Decimal(price.toString()).div(sum).toNumber())
  );

  return asPercentage;
};

const sumAndTakePercentagePerGroup = priceGroups => {
  const sums = priceGroups.map(priceGroup =>
    priceGroup.reduce(
      (acc, priceGroup) => acc.add(new Decimal(priceGroup)),
      new Decimal(0)
    )
  );

  const asPercentage = priceGroups.map((priceGroup, priceGroupIndex) =>
    priceGroup.map(price =>
      new Decimal(price.toString()).div(sums[priceGroupIndex]).toNumber()
    )
  );

  return asPercentage;
};

function* cartesian(head, ...tail) {
  const remainder = tail.length > 0 ? cartesian(...tail) : [[]];
  for (let r of remainder) for (let h of head) yield [h, ...r];
}

const PARTITION_IDS = ["ABCDEFGHI", "123456789", "XYZ??????", "IJK??????"];
export const resolvePartitionSets = pricesPerMarket => {
  // generate naming for partition sets (A, B, C... 1, 2, 3..., etc)
  let paritionGroupIndex = 0;
  const partitions = pricesPerMarket.map(priceGroup => {
    const partitionGroup = priceGroup.map((_, index) => {
      return PARTITION_IDS[paritionGroupIndex][index];
    });
    paritionGroupIndex++;
    return partitionGroup;
  });

  // generate multi-array cartesian product
  let pairCount = partitions.reduce(
    (acc, partitionGroup) => (acc *= partitionGroup.length),
    1
  );
  const groupCount = pairCount / partitions.length;
  let sets = [...cartesian(...partitions)].map(set => set.join("&")).sort();

  // "marketGroup" is actually not a real concept, but because the return values from various collections
  // use price groups in markets to determine probabilities/outcome costs, etc, it made sense to keep this
  // structure, but to group pairs to markets makes no sense conceptually.
  const marketGroups = [];
  for (let i = 0; i < pairCount; i++) {
    const groupIndex = Math.floor(i / groupCount);
    if (!marketGroups[groupIndex]) {
      marketGroups[groupIndex] = [];
    }

    marketGroups[groupIndex].push(sets[i]);
  }

  return {
    outcomeIds: partitions,
    outcomePairs: marketGroups
  };
};

export const resolveProbabilities = (pricesPerMarket, assumptions = []) => {
  const { outcomeIds, outcomePairs } = resolvePartitionSets(pricesPerMarket);
  // first, turn all prices into probabilities these represent probabilities in the form of P(A&X), P(A&Y), P(B&X), P(B&Y), etc
  // these will be referred to as "tangled" (im bad at naming and my knowledge of probability theory is limited, sorry!)
  const normProbabilitiesTangled = sumAndTakePercentage(pricesPerMarket);

  // "untangle" probabilities, making them represent individual outcomes, we receive probabilities (or rather the prices of them)
  // as tangled pairs of Market1's Outcomes * Market2's Outcomes * Market3's Outcomes, etc
  const probabilitiesUntangled = normProbabilitiesTangled.map(
    (outcomeProbabilities, outcomeProbabilitiesIndex) =>
      outcomeProbabilities.map((probability, probabilityIndex) => {
        // sum together all other outcome probability pairs
        // to calculate the probability that only this outcome happens
        // without considering any other outcome as a correlation

        const thisOutcomeId =
          outcomeIds[outcomeProbabilitiesIndex][probabilityIndex];
        const debugFormula = [];

        let probabilitySum = probability;
        normProbabilitiesTangled.forEach(
          (otherOutcomeProbabilities, otherOutcomeProbabilitiesIndex) => {
            otherOutcomeProbabilities.forEach(
              (otherProbability, otherProbabilityIndex) => {
                const outcomePairId =
                  outcomePairs[otherOutcomeProbabilitiesIndex][
                    otherProbabilityIndex
                  ];

                if (outcomePairId.indexOf(thisOutcomeId) > -1) {
                  debugFormula.push(`P(${outcomePairId})`);
                  probabilitySum += otherProbability;
                }
              }
            );
          }
        );

        console.info(
          `P(${thisOutcomeId}) = ${debugFormula.join(" + ")}`,
          probabilitySum
        );

        return probabilitySum;
      })
  );

  // Handle assumptions. Assumptions are conditions in the calculation of probabilities
  let assumedProbabilities = probabilitiesUntangled;
  if (assumptions.length > 0) {
    assumedProbabilities = probabilitiesUntangled.map(
      (probabilitiesGroup, probabilitiesGroupIndex) => {
        return probabilitiesGroup.map((probability, probabilityIndex) => {
          return probability; // todo: finish
        });
      }
    );
  }

  return {
    individual: sumAndTakePercentagePerGroup(probabilitiesUntangled),
    pairs: normProbabilitiesTangled,
    assumed: assumedProbabilities
  };
};
