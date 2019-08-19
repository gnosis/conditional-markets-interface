import { zeroDecimal, oneDecimal } from "./constants";

export const calcSelectedMarketProbabilitiesFromPositionProbabilities = (
  markets,
  allPositions,
  marketSelections,
  positionProbabilities
) => {
  const sumConsideredPositionProbabilities = whichPositions =>
    whichPositions
      .filter(({ outcomes }) =>
        outcomes.every(
          ({ marketIndex, outcomeIndex }) =>
            !marketSelections[marketIndex].isAssumed ||
            outcomeIndex === marketSelections[marketIndex].selectedOutcomeIndex
        )
      )
      .reduce(
        (acc, { positionIndex }) =>
          acc.add(positionProbabilities[positionIndex]),
        zeroDecimal
      );

  const allConsideredPositionsProbability = sumConsideredPositionProbabilities(
    allPositions
  );
  return markets.map(({ outcomes }, i) =>
    marketSelections != null && marketSelections[i].isAssumed
      ? outcomes.map((_, j) =>
          marketSelections[i].selectedOutcomeIndex === j
            ? oneDecimal
            : zeroDecimal
        )
      : outcomes.map(({ positions }) =>
          sumConsideredPositionProbabilities(positions).div(
            allConsideredPositionsProbability
          )
        )
  );
};
