import web3 from 'web3'

import { getDefaultAccount, loadContract, loadConfig } from "./web3"
import { generatePositionId } from './utils/positions'

const colors = ["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc","#e5d8bd","#fddaec","#f2f2f2"]

const { BN } = web3.utils


/**
 * Fetches markets, transforms them, adds data from smart contracts and returns them.
 * 
 * @param {*} assumedOutcomes Simulate prices, costs and probabilities with given outcomes
 */
export const loadMarkets = async () => {
  // load hardcoded market entries from config
  const { markets, lmsr } = await loadConfig()

  // load contracts
  const PMSystem = await loadContract('PredictionMarketSystem')
  const WETH = await loadContract('WETH9')
  const LMSR = await loadContract('LMSRMarketMaker', lmsr)
  const owner = await getDefaultAccount()


  // load all balances
  //balances = await retrieveBalances(PMSystem, markets)

  // load all outcome prices
  const outcomeSlotCount = (await LMSR.atomicOutcomeSlotCount()).toNumber()
  const outcomePrices = await Promise.all(
    Array(outcomeSlotCount).fill().map(
      async (_, index) => await LMSR.calcMarginalPrice(index)
    )
  )
  console.log(outcomePrices.join('\n'))
  const marginalPricesPerMarket = {}

  let marketIndex = 0
  let totalOutcomeIndex = 0
  while(totalOutcomeIndex < outcomeSlotCount) {
    const market = markets[marketIndex]
    const outcomesInMarket = (await PMSystem.getOutcomeSlotCount(market.conditionId)).toNumber()

    let marketOutcomeIndex = 0
    
    let marketOutcomePrices = Array(outcomesInMarket).fill(new BN(0))
    while(marketOutcomeIndex < outcomesInMarket) {
      if (!marginalPricesPerMarket[market.conditionId]) {
        marginalPricesPerMarket[market.conditionId] = new BN(0)
      }
      
      const outcomePrice = outcomePrices[totalOutcomeIndex]
      marketOutcomePrices[marketIndex] = outcomePrice
      marginalPricesPerMarket[market.conditionId] = marginalPricesPerMarket[market.conditionId].add(outcomePrice)

      totalOutcomeIndex++
      marketOutcomeIndex++
    }
    
    marketIndex++
  }

  // reset lmsr outcome index counter
  let lmsrOutcomeIndex = 0

  const marketsTransformed = await Promise.all(
    markets.map(async (market) => {
      // outcome transformation, loading contract data
      const outcomes = await Promise.all(market.outcomes.map(async (title) => {
        const decimals = 10
        const bnDecimalMultiplier = new BN(Math.pow(10, decimals))
        const positionId = generatePositionId(markets, WETH, lmsrOutcomeIndex)

        const balance = (await PMSystem.balanceOf(owner, positionId)).toString()
        console.log(owner, positionId)
        
        const outcomePrice = outcomePrices[lmsrOutcomeIndex]
        
        const marginalPriceMarket = marginalPricesPerMarket[market.conditionId].div(bnDecimalMultiplier).toNumber()
        const marginalPriceOutcome = outcomePrice.div(bnDecimalMultiplier).toNumber()
        
        let probability = 0
        if (marginalPriceMarket > 0 && marginalPriceOutcome > 0) {
          probability = marginalPriceOutcome / marginalPriceMarket
        } else {
          if (marginalPriceMarket > 0) {
            probability = 0
          }
          if (marginalPriceOutcome > 0) {
            probability = 1
          }
        }
        
        return {
          name: title,
          positionId,
          probability,
          lmsrOutcomeIndex: lmsrOutcomeIndex,
          color: colors[lmsrOutcomeIndex++],
          price: outcomePrice.toString(),
          balance,
        }
      }))

      return {
        ...market,
        outcomes,
      }
    })
  )

  return marketsTransformed
}

export const buyOutcomes = async (lmsrOutcomeIndexes, amount) => {
  const pricePerOutcome = amount / lmsrOutcomeIndexes.length
  console.log(lmsrOutcomeIndexes)

  // load all outcome prices
  const { lmsr } = await loadConfig()
  const LMSR = await loadContract('LMSRMarketMaker', lmsr)
  const outcomeSlotCount = (await LMSR.atomicOutcomeSlotCount()).toNumber()

  const buyList = Array(outcomeSlotCount).fill().map((_, position) => {
    if (lmsrOutcomeIndexes.indexOf(position) > -1) {
      return pricePerOutcome
    }

    return new BN(0)
  })

  console.log(buyList.map((n) => n.toString()))


  // get market maker instance
  const cost = await LMSR.calcNetCost.call(buyList)
  console.log({ cost })

  const defaultAccount = await getDefaultAccount()

  // get collateral
  const WETH = await loadContract('WETH9')
  await WETH.deposit({ value: cost, from: defaultAccount })
  await WETH.approve(LMSR.address, cost, { from: defaultAccount })


  // run trade
  const tx = await LMSR.trade(buyList, cost, { from: defaultAccount })
  console.log(tx)
}

export const sellOutcomes = () => {
  alert('currently not functioning... :(')
}