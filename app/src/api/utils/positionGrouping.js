import 'lodash.combinations';
import { combinations } from 'lodash'

import { cartesian } from './probabilities';
import Decimal from "decimal.js";

/**
 * Generates a grouping of positions to state specific conditions correlation or independance of one-another
 *
 * @param {[[String, Number]]} groups - Balances of all atomic outcomes, in the format of ["AyByCy", 1000]
 */
export const resolvePositionGrouping = outcomeHoldingPairs => {
  console.log(outcomeHoldingPairs)

  // [[["Ay", "By", "Cy"] 1337], ...]
  const things = outcomeHoldingPairs.map(([ atomicOutcome, balance ]) => (
    [atomicOutcome.split("&"), balance]
  ))

  const conditions = [["Ay", "An"], ["By", "Bn"], ["Cy", "Cn"]]
  const output = []

  for(let numConditions = 0; numConditions <= conditions.length; numConditions++) {
    for (let conditionTuple of combinations(conditions, numConditions)) {      
      (numConditions === 0 ? [[]] : [...cartesian(...conditionTuple)]).forEach((cartesianTuple) => {
        const filteredThings = things.filter(([ atomicOutcome, balance ]) => cartesianTuple.every((condition) => atomicOutcome.includes(condition)))

        const minValue = Math.min(...filteredThings.map((something) => something[1]))

        if (minValue > 0) {
          output.push([cartesianTuple.join("&"), minValue])

          filteredThings.forEach((filteredthing) => {
            filteredthing[1] -= minValue
          })
        }
      })
    }
  }

  return output


  /*
  // start by generating a permutation table of all possible "paths" a position can have, for example
  // AyBy** to show a position that is independant of C. For this we first take all "concrete" outcomes
  // and then slowly remove outcome positions, until we end up with a list of all possible groups, using only
  // the unique values results in A-Outcomes + B-Outcomes / 2 + C-Outcomes / 4, etc
  let outcomePermutations = [...groups.map(([atomicOutcome]) => atomicOutcome)];

  let shorterGroups = [...outcomePermutations];
  while (shorterGroups[0].length > 0) {
    // set as new group, checking first entry in array if the value is still long enough, this will
    // slowly turn outcome groups such as AyByCy into AyBy and Ay, to generate all possible permutations
    shorterGroups = [
      ...shorterGroups.map(atomicOutcome => {
        const outcomes = atomicOutcome.split(/&/g);
        outcomes.pop();

        return outcomes.join("&");
      })
    ];
    outcomePermutations.push(...shorterGroups);
  }

  const targetPermutations = uniq(outcomePermutations).map(outcomes =>
    outcomes.split(/&/g).filter(id => id.length > 0)
  );

  // now for all "targets", we filter the list of atomic outcome balances and take the lowest value from all
  // "groups" that include our target ids, e.g. Outcome: AyByCy Target: AyBy** will match this outcome, and compare
  // the currently lowest value with the lowest value of AyByCy, and if it's lower, use that. This will show the "guaranteed"
  // winnings for all possible positions a user can take.
  const minimumGuaranteedWinnings = targetPermutations.map(idsInTarget => {
    const minSum = groups.reduce((minAmount, [atomicOutcome, value]) => {
      const idsInOutcome = atomicOutcome.split(/&/g);

      if (idsInTarget.every(id => idsInOutcome.includes(id))) {
        return Math.min(value, minAmount);
      }

      return minAmount;
    }, Infinity);

    return [idsInTarget, isFinite(minSum) ? minSum : 0];
  });

  let carriedGroups = [];
  let minimumGuaranteedWinningsSimplified = minimumGuaranteedWinnings
  
  // because im bad and in a hurry this just tries again until nothing changes anymore
  do {
    carriedGroups = []

    minimumGuaranteedWinningsSimplified = minimumGuaranteedWinningsSimplified
    .reduce((groups, group, index) => {
      const [idsInTarget, amount] = group;

      // 1. find opposite last outcome (AyByCy) => AyByCn
      // 2. is same as current, remove and distribute amount to AyBy
      // TODO: hardcoded for y/n

      const oppositeGroup = find(
        minimumGuaranteedWinnings,
        ([idsInOtherTarget], otherIndex) =>
          // check self
          index !== otherIndex &&
          // exactly one difference (opposite)
          difference(idsInTarget, idsInOtherTarget).length === 1 &&
          // same length
          idsInTarget.length === idsInOtherTarget.length
      );

      if (oppositeGroup) {
        const [oppositeIds, oppositeAmount] = oppositeGroup;

        if (oppositeAmount === amount) {
          let target = idsInTarget.slice(0, -1);
          carriedGroups.push([target, group]);
          return groups;
        }
      }

      return [...groups, group];
    }, [])
    .map(([idsInTarget, amount]) => {
      const sumToAdd = carriedGroups
        .filter(([target]) => idsInTarget.join("&") === target.join("&"))
        .map(([target, [ids, otherAmount]]) => otherAmount)
        .reduce((acc, otherAmount) => acc.plus(new Decimal(otherAmount)), new Decimal(amount));
      
      return [idsInTarget, new Decimal(sumToAdd).toString()];
    });
  } while (carriedGroups.length > 0)

  return minimumGuaranteedWinningsSimplified.map(([ids, amount]) => [ids.join('&'), amount]).filter(([_, amount]) => new Decimal(amount).gt(new Decimal(0)));
  */
};
