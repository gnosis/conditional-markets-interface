import Web3 from "web3";
import { product, combinations } from "./itertools";

const { toBN } = Web3.utils;

const maxUint256 = Web3.utils.toBN(`0x${"ff".repeat(32)}`);

export function calcPositionGroups(markets, positions, positionAmounts) {
  const positionGroups = [];

  let runningPositionAmounts = positionAmounts.map(amount =>
    toBN(amount.toFixed ? amount.toFixed(0) : amount.toString())
  );

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

        const [groupAmount] = groupPositions.reduce(
          ([acc], { positionIndex }) => [
            acc.lte(runningPositionAmounts[positionIndex])
              ? acc
              : runningPositionAmounts[positionIndex]
          ],
          [maxUint256]
        );

        if (groupAmount.gtn(0)) {
          positionGroups.push({
            outcomeSet,
            amount: groupAmount,
            positions: groupPositions
          });

          for (const { positionIndex } of groupPositions) {
            runningPositionAmounts[positionIndex] = runningPositionAmounts[
              positionIndex
            ].sub(groupAmount);
          }
        }
      }
    }
  }

  return positionGroups;
}
