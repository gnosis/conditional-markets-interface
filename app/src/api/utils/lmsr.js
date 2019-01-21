import Decimal from 'decimal.js'

import { generatePositionId } from './positions'
import { loadContract } from '../web3';

const lmsrMarginalPrice = (funding, netOutcomeTokensSold, outcomeIndex) => {
  const b = new Decimal(funding.toString()).div(Decimal.ln(netOutcomeTokensSold.length))
  const numerator = new Decimal(netOutcomeTokensSold[outcomeIndex].toString()).div(b).exp()
  const denominator = netOutcomeTokensSold.reduce(
      (acc, tokensSold) => acc.add(new Decimal(tokensSold.toString()).div(b).exp()),
      new Decimal(0)
  )
  return numerator.div(denominator).toString()
}

const lmsrCalcNetCost = (_funding, balances, outcomeTokenAmounts) => {
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

window.lmsrCalcNetCost = lmsrCalcNetCost

const lmsrNetCost = async (markets) => {
  const LMSR = await loadContract('LMSRMarketMaker', '0x8c6aad0c92a48112aaa0e6e8f98a160120f17059')
  const WETH9 = await loadContract('WETH9')
  const PMSystem = await loadContract('PredictionMarketSystem')

  let lmsrOutcomeIndex = 0
  const lmsrBalances = []
  const loadBalancePromise = Promise.all(markets.map(async (market) => {
    const outcomeCount = (await PMSystem.getOutcomeSlotCount(market.conditionId)).toNumber()
    return Promise.all(Array(outcomeCount).fill().map(async () => {
      const positionId = generatePositionId(markets, WETH9, lmsrOutcomeIndex++)
      const lmsrBalance = await LMSR.balanceOf(LMSR.address, positionId)

      lmsrBalances[lmsrOutcomeIndex] = {
        balance: lmsrBalance,
        positionId,
      }
    }))
  }))

  await loadBalancePromise

  // return generator
  return (tokenAmounts) => {

  }
}