import Web3 from "web3";
import { maxUint256BN, zeroDecimal } from "./constants";
import { product, combinations, permutations } from "./itertools";
import { combineCollectionIds } from "./getIdsUtil";

import Decimal from "decimal.js-light";
const { toBN } = Web3.utils;

export function calcOutcomeTokenCounts(
  positions,
  { funding, positionBalances },
  amount,
  marketSelections
) {
  if (
    marketSelections.every(
      ({ isAssumed, selectedOutcomeIndex }) =>
        isAssumed || selectedOutcomeIndex === -1
    )
  )
    throw new Error(
      "Pick at least one non-conditional market outcome (any row below THEN ↓)."
    );

  const invB = new Decimal(positions.length).ln().dividedBy(funding.toString());

  const positionTypes = new Array(positions.length).fill(null);

  let refundedTerm = zeroDecimal;
  let takenTerm = zeroDecimal;
  let refusedTerm = zeroDecimal;
  positions.forEach(({ positionIndex, outcomes }) => {
    const balance = positionBalances[positionIndex].toString();
    if (
      outcomes.some(
        ({ marketIndex, outcomeIndex }) =>
          marketSelections[marketIndex].isAssumed &&
          outcomeIndex !== marketSelections[marketIndex].selectedOutcomeIndex
      ) // Evaluate refund amount
    ) {
      refundedTerm = refundedTerm.add(
        amount
          .sub(balance)
          .mul(invB)
          .exp()
      );
      positionTypes[positionIndex] = "refunded";
    } else if (
      // Evaluate earn amount
      outcomes.every(
        ({ marketIndex, outcomeIndex }) =>
          marketSelections[marketIndex].selectedOutcomeIndex == -1 ||
          outcomeIndex === marketSelections[marketIndex].selectedOutcomeIndex
      )
    ) {
      takenTerm = takenTerm.add(
        invB
          .mul(balance)
          .neg()
          .exp()
      );
      positionTypes[positionIndex] = "taken";
    } else {
      // Evaluate loss amount
      refusedTerm = refusedTerm.add(
        invB
          .mul(balance)
          .neg()
          .exp()
      );
      positionTypes[positionIndex] = "refused";
    }
  });
  const takenPositionsAmountEach = amount
    .mul(invB)
    .exp()
    .sub(refundedTerm)
    .sub(refusedTerm)
    .div(takenTerm)
    .ln()
    .div(invB)
    .toInteger();

  return positionTypes.map(type => {
    if (type === "taken") return takenPositionsAmountEach;
    if (type === "refunded") return amount;
    if (type === "refused") return zeroDecimal;
    throw new Error(`Position types [${positionTypes.join(", ")}] invalid`);
  });
}

export function calcPositionGroups(markets, positions, positionAmounts) {
  let bestPositionGroups = null;
  let bestPositionGroupsScore = Infinity;

  positionGroupSearch: for (const marketsPermutation of permutations(markets)) {
    const positionGroups = [];
    let positionGroupsScore = 0;

    let positionAmountsCopy = positionAmounts.map(amount =>
      toBN(amount.toFixed ? amount.toFixed(0) : amount.toString())
    );
    let runningPositionAmounts = positionAmountsCopy.slice();

    let outcomesToCombine = marketsPermutation.map(market =>
      market.outcomes.map((outcome, outcomeIndex) => ({
        ...outcome,
        marketIndex: market.marketIndex,
        outcomeIndex
      }))
    );

    for (let numMarkets = 1; numMarkets <= markets.length; ++numMarkets) {
      for (const outcomesTuples of combinations(
        outcomesToCombine,
        numMarkets
      )) {
        for (const outcomeSet of product(...outcomesTuples)) {
          const groupPositions = outcomeSet.reduce(
            (positionsIntersection, { positions: outcomePositions }) =>
              positionsIntersection.filter(
                ({ id }) =>
                  outcomePositions.find(({ id: otherId }) => id === otherId) !=
                  null
              ),
            positions
          );

          const [groupAmount, groupRunningAmount] = groupPositions.reduce(
            ([accAmount, accRunningAmount], { positionIndex }) => [
              accAmount.lte(positionAmountsCopy[positionIndex])
                ? accAmount
                : positionAmountsCopy[positionIndex],
              accRunningAmount.lte(runningPositionAmounts[positionIndex])
                ? accRunningAmount
                : runningPositionAmounts[positionIndex]
            ],
            [maxUint256BN, maxUint256BN]
          );

          if (groupRunningAmount.gtn(0)) {
            if (positionGroupsScore + numMarkets >= bestPositionGroupsScore)
              continue positionGroupSearch;
            positionGroupsScore += numMarkets;

            const collectionIds = outcomeSet.map(({ collectionId }) => {
              return collectionId;
            });
            const combinedCollectionIds = combineCollectionIds(collectionIds);
            positionGroups.push({
              collectionId: combinedCollectionIds,
              outcomeSet,
              amount: groupAmount,
              runningAmount: groupRunningAmount,
              positions: groupPositions
            });

            for (const { positionIndex } of groupPositions) {
              runningPositionAmounts[positionIndex] = runningPositionAmounts[
                positionIndex
              ].sub(groupRunningAmount);
            }
          }
        }
      }
    }

    bestPositionGroups = positionGroups;
    bestPositionGroupsScore = positionGroupsScore;
  }

  return bestPositionGroups;
}
