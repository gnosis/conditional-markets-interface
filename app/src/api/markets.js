import web3 from 'web3'

import { loadContract, loadConfig } from "./web3"
import { generatePositionId } from './utils/positions'
import { retrieveBalances } from './balances'

const colors = ["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc","#e5d8bd","#fddaec","#f2f2f2"]

const { BN } = web3.utils

let balances = {}
let marginalPricesPerMarket = {}
let outcomePrices = []
let lmsrOutcomeIndex = 0
const transformOutcome = (market) => async (title) => {
  const WETH = await loadContract('WETH9')
  const { markets } = await loadConfig()

  const positionId = generatePositionId(markets, WETH, lmsrOutcomeIndex)
  
  const probability = outcomePrices[lmsrOutcomeIndex].toString() / marginalPricesPerMarket[market.conditionId].toString()
  
  const outcome = {
    name: title,
    positionId,
    probability,
    lmsrOutcomeIndex: lmsrOutcomeIndex,
    balance: balances[positionId],
    color: colors[lmsrOutcomeIndex]
  }

  lmsrOutcomeIndex++

  return outcome
}

const transformMarket = (assumedOutcomes) => async (market) => {
  const marketTransformed = { ...market }
  marketTransformed.outcomes = (await Promise.all(market.outcomes.map(transformOutcome(market))))

  return marketTransformed
}

/**
 * Fetches markets, transforms them, adds data from smart contracts and returns them.
 * 
 * @param {*} assumedOutcomes Simulate prices, costs and probabilities with given outcomes
 */
export const loadMarkets = async (assumedOutcomes) => {
  // load hardcoded market entries from config
  const { markets, lmsr } = await loadConfig()

  // load contracts
  const PMSystem = await loadContract('PredictionMarketSystem')
  const WETH = await loadContract('WETH9')
  const LMSR = await loadContract('LMSRMarketMaker', lmsr)

  // load all balances
  balances = await retrieveBalances(PMSystem, markets)

  // load all outcome prices
  const outcomeSlotCount = (await LMSR.atomicOutcomeSlotCount()).toNumber()
  outcomePrices = await Promise.all(Array(outcomeSlotCount).fill().map(async (_, index) => (
    (await LMSR.calcMarginalPrice(index))
  )))
  console.log({ outcomePrices })

  marginalPricesPerMarket = {}

  let marketIndex = 0
  let totalOutcomeIndex = 0
  while(totalOutcomeIndex < outcomeSlotCount) {
    console.log({marketIndex, totalOutcomeIndex, market})
    const market = markets[marketIndex]
    const outcomesInMarket = (await PMSystem.getOutcomeSlotCount(market.conditionId)).toNumber()

    let marketOutcomeIndex = 0
    let marketOutcomePrices = []
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
  lmsrOutcomeIndex = 0
  const marketsTransformed = await Promise.all(markets.map(
      transformMarket(assumedOutcomes, WETH, markets)
    ))

  return marketsTransformed
}