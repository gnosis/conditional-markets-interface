import Web3 from "web3";
import { maxUint256BN } from "./constants";
import { product, combinations } from "./itertools";

const { toBN, toHex, padLeft } = Web3.utils;

export function calcPositionGroups(markets, positions, positionAmounts) {
  const positionGroups = [];

  let positionAmountsCopy = positionAmounts.map(amount =>
    toBN(amount.toFixed ? amount.toFixed(0) : amount.toString())
  );
  let runningPositionAmounts = positionAmountsCopy.slice();

  for (let numMarkets = 0; numMarkets <= markets.length; ++numMarkets) {
    for (const outcomesTuples of combinations(
      markets.map(({ outcomes }) => outcomes),
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
