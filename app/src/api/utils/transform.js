import web3 from 'web3'

import { generatePositionId } from './positions'

const { BN } = web3.utils

const colors = ["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc","#e5d8bd","#fddaec","#f2f2f2"]

const transformMarketEntries = async (markets, pmSystems, lmsr, collateral) => {
  const outcomeSlotCount = (await lmsr.atomicOutcomeSlotCount()).toNumber()
  const outcomePrices = await Promise.all(Array(outcomeSlotCount).fill().map(async (_, index) => (
    (await lmsr.calcMarginalPrice(index))
  )))

  //window.generatePositionId = (i) => generatePositionId(markets, collateral, i)

  const marginalPricesPerMarket = outcomePrices.reduce((acc, n, index) => {
    // has to stay at 2 for now. 2 outcomes per market, otherwise this breaks
    const marketIndex = Math.floor(index / 2)
    
    if (typeof acc[marketIndex] === 'undefined') {
      acc[marketIndex] = new BN(0)
    }

    acc[marketIndex] = acc[marketIndex].add(n)
    return acc
  }, [])

  // LMSR keeps track of all outcomes for all markets
  let lmsrOutcomeIndex = 0
  return markets.map((market, marketIndex) => ({
    ...market,
    outcomes: market.outcomes.map((outcome) => {
      const outcomePrice = outcomePrices[lmsrOutcomeIndex]
      if (!outcomePrice) {
        console.warn(`Outcome ${lmsrOutcomeIndex} not defined`)
      }

      const probability = (outcomePrice / marginalPricesPerMarket[marketIndex])
      const positionId = generatePositionId(markets, collateral, lmsrOutcomeIndex)
      //console.log(positionId)
      const outcomeTransformed = {
        name: outcome,
        lmsrIndex: lmsrOutcomeIndex,
        probability,
        price: outcomePrice.div(new BN(2).pow(new BN(18))).toNumber(),
        positionId,
        color: colors[lmsrOutcomeIndex],
      }

      lmsrOutcomeIndex++
      return outcomeTransformed
    })
  }))
}

export default transformMarketEntries