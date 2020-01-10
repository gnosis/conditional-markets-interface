import Decimal from "decimal.js-light";
import { zeroDecimal, oneDecimal } from "./constants";

export const getMarketProbabilities = (
  funding,
  positionBalances,
  markets,
  positions,
  marketSelections
) => {
  // funding = 1000
  // positionBalances = [100, 500]
  const invB = new Decimal(positionBalances.length)
    .ln()
    .div(funding.toString());
  // 1e-123

  const positionProbabilities = positionBalances.map(balance =>
    invB
      .mul(balance.toString())
      .neg()
      .exp()
  );
  // [ 1e-1000, 5e-1000 ]

  return {
    invB,
    positionProbabilities,
    newMarketProbabilities: calcSelectedMarketProbabilitiesFromPositionProbabilities(
      markets,
      positions,
      marketSelections,
      positionProbabilities
    )
    // [ 0.4, 0.6 ]
  };
};

export const getStagedMarketProbabilities = ({
  positionProbabilities,
  invB,
  stagedTradeAmounts,
  markets,
  positions,
  marketSelections
}) => {
  const unnormalizedPositionProbabilitiesAfterStagedTrade = positionProbabilities.map(
    (probability, i) => probability.mul(stagedTradeAmounts[i].mul(invB).exp())
  );
  const normalizer = oneDecimal.div(
    unnormalizedPositionProbabilitiesAfterStagedTrade.reduce((a, b) => a.add(b))
  );
  const positionProbabilitiesAfterStagedTrade = unnormalizedPositionProbabilitiesAfterStagedTrade.map(
    probability => probability.mul(normalizer)
  );

  return calcSelectedMarketProbabilitiesFromPositionProbabilities(
    markets,
    positions,
    marketSelections,
    positionProbabilitiesAfterStagedTrade
  );
};

export const calcSelectedMarketProbabilitiesFromPositionProbabilities = (
  markets,
  allPositions,
  marketSelections,
  positionProbabilities
) => {
  const sumConsideredPositionProbabilities = whichPositions =>
    whichPositions
      .filter(({ outcomes }) =>
        !marketSelections
          ? outcomes
          : outcomes.every(
              ({ marketIndex, outcomeIndex }) =>
                !marketSelections[marketIndex].isAssumed ||
                outcomeIndex ===
                  marketSelections[marketIndex].selectedOutcomeIndex
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
