import Decimal from "decimal.js";

import { generatePositionId } from "./positions";
import { loadContract } from "../web3";

/**
 * Calculates the marginal prices in the LMSR contract for a specific outcome. Marginal prices can be used as probabilities.
 *
 * @param {String|Number|BigNumber|Decimal} funding - Funding the LMSR was created with
 * @param {String[]|Number[]|BigNumber[]|Decimal[]} lmsrTokenBalances - Array of all token balances that the LMSR holds
 * @param {Number} outcomeIndex - Index of the outcome you want to calculate the marginal price for
 * @returns {Decimal} - marginalPrice of the specified outcomes index
 */
export const lmsrMarginalPrice = (
  funding,
  lmsrTokenBalances,
  outcomeIndex
) => {
  const liquidityParam = new Decimal(funding.toString()).dividedBy(
    new Decimal(lmsrTokenBalances.length).ln()
  );

  return new Decimal(lmsrTokenBalances[outcomeIndex].toString()).neg().dividedBy(liquidityParam).exp()
};

export const lmsrTradeCost = (_funding, balances, outcomeTokenAmounts) => {
  // markets funding
  const funding = new Decimal(_funding);
  let sumBefore = new Decimal(0);

  // balance before trade
  balances.forEach(balance => {
    sumBefore = sumBefore.add(
      Decimal(balance)
        .div(funding)
        .exp()
    );
  });
  const costBefore = funding.log(sumBefore);

  let sumAfter = new Decimal(0);

  // balance after trade
  balances.forEach((balance, tokenIndex) => {
    sumAfter = sumAfter.add(
      new Decimal(balance)
        .add(outcomeTokenAmounts[tokenIndex])
        .div(funding)
        .exp()
    );
  });
  const costAfter = funding.log(sumAfter);

  // sum of both equals cost of trade
  return costBefore.sub(costAfter);
};

export const lmsrNetCost = (
  funding,
  tokenAmounts,
  lmsrTokenBalances,
) => {
  // netCost = Funding * log2(2**((tokenAmounts[0]-lmsrTokenBalances[0])/F) + 2**((tokenAmounts[1]-lmsrTokenBalances[1])/F)) + ...
  const decimalFunding = new Decimal(funding.toString())
  const tokenDifferences = tokenAmounts.map((amount, index) => {
    const decimalAmount = new Decimal(amount)
    const decimalBalance = new Decimal(lmsrTokenBalances[index].toString())

    return Decimal.sub(decimalAmount, decimalBalance).dividedBy(decimalFunding)
  })

  return tokenDifferences.reduce((acc, difference) => {
    return acc.plus(difference.exp().ln())
  }, new Decimal(0))
};

/**
 * Calculates an estimation of amounts of outcome tokens (positions) that can be bought with the specified invest in collateral "amount".
 *
 * @param {String|Number|BigNumber|Decimal} funding - the LMSRs total funding for the markets
 * @param {String[]|Number[]|BigNumber[]|Decimal[]} lmsrTokenBalances - Amount of tokens the LMSR Market Maker has as inventory
 * @param {Number[]} outcomenTokenIndexes - Indexes of the outcome tokens (positions) the user wants to invest in
 * @param {String|Number|BigNumber|Decimal} amount - Amount of collateral the user wants to invest
 */
export const lmsrCalcOutcomeTokenCount = (
  funding,
  lmsrTokenBalances,
  outcomenTokenIndexes,
  amount,
  unassumedTokenIndexes,
) => {
  const collateralAmount = new Decimal(amount.toString()).times(new Decimal(10).pow(18))
  const atomicOutcomeCount = lmsrTokenBalances.length

  const liquidityParam = new Decimal(funding.toString()).dividedBy(
    new Decimal(atomicOutcomeCount).ln()
  );

  const lmsrTokenBalancesInsideSet = lmsrTokenBalances.filter((_, index) => outcomenTokenIndexes.includes(index))
  const lmsrTokenBalancesOutsideSetUnassumed = lmsrTokenBalances.filter((_, index) => !outcomenTokenIndexes.includes(index) && unassumedTokenIndexes.includes(index))
  const lmsrTokenBalancesOutsideSetAssumed = lmsrTokenBalances.filter((_, index) => !outcomenTokenIndexes.includes(index) && !unassumedTokenIndexes.includes(index))

  const negExpSummer = (acc, numShares) => acc.plus(
    new Decimal(numShares.toString()).neg().dividedBy(liquidityParam).exp()
  )

  const shareAmountEach = liquidityParam.times(
    collateralAmount.dividedBy(liquidityParam).exp().sub(
      lmsrTokenBalancesOutsideSetUnassumed.reduce(negExpSummer, new Decimal(0)).mul(collateralAmount.dividedBy(liquidityParam).exp())
    ).sub(
      lmsrTokenBalancesOutsideSetAssumed.reduce(negExpSummer, new Decimal(0))
    ).dividedBy(
      lmsrTokenBalancesInsideSet.reduce(negExpSummer, new Decimal(0))
    ).ln()
  ).floor();

  return lmsrTokenBalances.map((_, index) => {
    if (outcomenTokenIndexes.includes(index)) return shareAmountEach.toString()
    if (unassumedTokenIndexes.includes(index)) return collateralAmount.toString()
    return "0"
  })
};
window.lmsrCalcOutcomeTokenCount = lmsrCalcOutcomeTokenCount