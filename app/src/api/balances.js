import { getDefaultAccount, loadContract } from './web3'

import web3 from 'web3'
import { generatePositionId } from './utils/positions'
//import './utils/lmsr'

const { toBN } = web3.utils

export const retrieveBalances = async (pmsystem, markets, _positionIds) => {
  const owner = await getDefaultAccount()
 
  let positionIds = _positionIds
  if (!Array.isArray(positionIds)) {
    // use position id generator
    const collateral = await loadContract('WETH9')

    let lmsrOutcomeIndex = 0
    positionIds = []
    const outcomeCountPromise = Promise.all(markets.map(async (market) => {
      const outcomeSlots = await pmsystem.getOutcomeSlotCount(market.conditionId)
      Array(outcomeSlots.toNumber()).fill().forEach((_, i) => {
        //console.log(i)
        positionIds.push(generatePositionId(markets, collateral, lmsrOutcomeIndex + 1))
        //console.log(lmsrOutcomeIndex)
        lmsrOutcomeIndex++
      })
    }))
    await outcomeCountPromise
    
    // old system just got all events from the past
    /*
    // retrieve all events
    const buyEventsPromise = pmsystem.getPastEvents("TransferSingle", { fromBlock: 0, toBlock: 'latest', filter: { _to: owner }})
    const sellEventsPromise = pmsystem.getPastEvents("TransferSingle", { fromBlock: 0, toBlock: 'latest', filter: { _from: owner }})
  
    // wait for both promises
    const [buyEvents, sellEvents] = await Promise.all([buyEventsPromise, sellEventsPromise])
  
    // retrieve ids of events
    const eventPositionIds = [...buyEvents, ...sellEvents]
      .map((logEntry) => `0x${toBN(logEntry.args._id).toString(16)}`)
      
    // remove duplicates
    positionIds = [...new Set(eventPositionIds)]  
    */
  }
  
  // get position balances
  const balances = {}

  const balancePromises = Promise.all(positionIds.map(async (positionId) => {
    balances[positionId] = (await pmsystem.balanceOf(owner, positionId)).toString()
  }))
  
  await balancePromises

  return balances
}