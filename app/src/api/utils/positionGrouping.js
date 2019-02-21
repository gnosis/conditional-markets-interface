import { uniq } from "lodash";

/**
 * Generates a grouping of positions to state specific conditions correlation or independance of one-another
 *
 * @param {[[String, Number]]} groups - Balances of all atomic outcomes, in the format of ["AyByCy", 1000]
 */
export const resolvePositionGrouping = groups => {
  // start by generating a permutation table of all possible "paths" a position can have, for example
  // AyBy** to show a position that is independant of C. For this we first take all "concrete" outcomes
  // and then slowly remove outcome positions, until we end up with a list of all possible groups, using only
  // the unique values results in A-Outcomes + B-Outcomes / 2 + C-Outcomes / 4, etc
  let outcomePermutations = [...groups.map(([atomicOutcome]) => atomicOutcome)];

  let shorterGroups = [...outcomePermutations];
  while (shorterGroups[0].length > 0) {
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
  return targetPermutations
    .map(idsInTarget => {
      const minSum = groups.reduce((minAmount, [atomicOutcome, value]) => {
        const idsInOutcome = atomicOutcome.split(/&/g);

        if (idsInTarget.every(id => idsInOutcome.includes(id))) {
          return Math.min(value, minAmount);
        }

        return minAmount;
      }, Infinity);

      return [idsInTarget.join("&"), isFinite(minSum) ? minSum : 0];
    })
    .filter(([idsInTarget, amount]) => amount > 0);
};
