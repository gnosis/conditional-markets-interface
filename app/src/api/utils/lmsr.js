import Decimal from 'decimal.js'

import { generatePositionId } from './positions'
import { loadContract } from '../web3';

/// funding: 10000
/// outcomes: [A, B]
/// netOutcomeTokensSold: [10, 100]

/// b = 10000 / Log(Anzahl Outcomes)
export const lmsrMarginalPrice = (funding, netOutcomeTokensSold, outcomeIndex) => {
  const b = new Decimal(funding.toString()).div(Decimal.ln(netOutcomeTokensSold.length))
  const numerator = new Decimal(netOutcomeTokensSold[outcomeIndex].toString()).div(b).exp()
  const denominator = netOutcomeTokensSold.reduce(
      (acc, tokensSold) => acc.add(new Decimal(tokensSold.toString()).div(b).exp()),
      new Decimal(0)
  )
  return numerator.div(denominator).toString()
}

export const lmsrCalcNetCost = (_funding, balances, outcomeTokenAmounts) => {
  // markets funding
  const funding = new Decimal(_funding)
  let sumBefore = new Decimal(0)

  // balance before trade
  balances.forEach((balance) => {
    sumBefore = sumBefore.add(Decimal(balance).div(funding).exp())
  })
  const costBefore = funding.log(sumBefore)

  let sumAfter = new Decimal(0)

  // balance after trade
  balances.forEach((balance, tokenIndex) => {
    sumAfter = sumAfter.add(new Decimal(balance).add(outcomeTokenAmounts[tokenIndex]).div(funding).exp())
  })
  const costAfter = funding.log(sumAfter)

  // sum of both equals cost of trade
  return costBefore.sub(costAfter)
}

export const lmsrNetCost = async (markets, lmsr) => {
  const LMSR = await loadContract('LMSRMarketMaker', lmsr)
  const WETH9 = await loadContract('WETH9')
  const PMSystem = await loadContract('PredictionMarketSystem')

  let lmsrOutcomeIndex = 0
  const lmsrBalances = []
  const loadBalancePromise = Promise.all(markets.map(async (market) => {
    const outcomeCount = (await PMSystem.getOutcomeSlotCount(market.conditionId)).toNumber()
    return Promise.all(Array(outcomeCount).fill().map(async () => {
      const positionId = generatePositionId(markets, WETH9, lmsrOutcomeIndex++)
      const lmsrBalance = (await PMSystem.balanceOf(lmsr, positionId)).toString()
      
      lmsrBalances[lmsrOutcomeIndex] = {
        balance: lmsrBalance.toString(),
        positionId,
      }
    }))
  }))

  const atomicOutcomeCount = (await LMSR.atomicOutcomeSlotCount()).toNumber();
  const atomicOutcomeLog = new Decimal(atomicOutcomeCount).mul(1e18)

  await loadBalancePromise

  // return generator
  return async (tokenAmounts) => {
    
    return await LMSR.calcNetCost(tokenAmounts)
  }
}