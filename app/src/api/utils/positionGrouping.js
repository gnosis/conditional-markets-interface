import { cartesian } from "./probabilities";
import Web3 from "web3";

const { toBN } = Web3.utils;

function* combinations(arr, n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error(`invalid combination size ${n}`);

  if (n === 0 || arr.length < n) {
    return;
  }
  if (n === 1) {
    yield* arr.map(el => [el]);
  }
  for (let i = 0; i < arr.length - n + 1; i++) {
    for (const subTuple of combinations(arr.slice(i + 1), n - 1))
      yield [arr[i], ...subTuple];
  }
}

/**
 * Generates a grouping of positions to state specific conditions correlation or independance of one-another
 *
 * @param {[[String, Number]]} groups - Balances of all atomic outcomes, in the format of ["AyByCy", 1000]
 */
export const resolvePositionGrouping = (
  marketOutcomeNames,
  outcomeHoldingPairs
) => {
  // console.log(outcomeHoldingPairs)

  // [[["Ay", "By", "Cy"] 1337], ...]
  const things = outcomeHoldingPairs.map(([atomicOutcome, balance]) => [
    atomicOutcome.split("&"),
    balance
  ]);

  const conditions = marketOutcomeNames; // [["Ay", "An"], ["By", "Bn"], ["Cy", "Cn"]]
  const output = [];

  for (
    let numConditions = 0;
    numConditions <= conditions.length;
    numConditions++
  ) {
    for (let conditionTuple of combinations(conditions, numConditions)) {
      (numConditions === 0 ? [[]] : [...cartesian(...conditionTuple)]).forEach(
        cartesianTuple => {
          const filteredThings = things.filter(([atomicOutcome]) =>
            cartesianTuple.every(condition => atomicOutcome.includes(condition))
          );

          const affectedAtomicOutcomes = filteredThings.map(
            ([atomicOutcome]) => atomicOutcome
          );
          const minValue = filteredThings.reduce((minSoFar, [, valStr]) => {
            const nextVal = toBN(valStr);
            if (minSoFar == null || nextVal.lt(minSoFar)) return nextVal;
            return minSoFar;
          }, null);

          if (minValue > 0) {
            output.push([
              cartesianTuple.join("&"),
              minValue.toString(),
              affectedAtomicOutcomes.map(ids => ids.join("&"))
            ]);

            filteredThings.forEach(filteredthing => {
              filteredthing[1] = toBN(filteredthing[1])
                .sub(minValue)
                .toString();
            });
          }
        }
      );
    }
  }

  return output;
};
