import Web3 from "web3";
import { maxUint256BN, zeroDecimal } from "./constants";
import { product, combinations } from "./itertools";

import Decimal from "decimal.js-light";
const { toBN, toHex, padLeft } = Web3.utils;

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
    throw new Error("At least one outcome selection must be made");

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
      )
    ) {
      refundedTerm = refundedTerm.add(
        amount
          .sub(balance)
          .mul(invB)
          .exp()
      );
      positionTypes[positionIndex] = "refunded";
    } else if (
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
  const positionGroups = [];

  let positionAmountsCopy = positionAmounts.map(amount =>
    toBN(amount.toFixed ? amount.toFixed(0) : amount.toString())
  );
  let runningPositionAmounts = positionAmountsCopy.slice();

  let outcomesToCombine = markets.map((market, marketIndex) =>
    market.outcomes.map((outcome, outcomeIndex) => ({
      ...outcome,
      marketIndex,
      outcomeIndex
    }))
  );

  for (let numMarkets = 0; numMarkets <= markets.length; ++numMarkets) {
    for (const outcomesTuples of combinations(outcomesToCombine, numMarkets)) {
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
          positionGroups.push({
            collectionId: padLeft(
              toHex(
                outcomeSet.reduce(
                  (acc, { collectionId }) => acc.add(toBN(collectionId)),
                  toBN(0)
                )
              ),
              64
            ),
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

  return positionGroups;
}
