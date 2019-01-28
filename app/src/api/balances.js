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
  }
  
  // get position balances
  const balances = {}

  const balancePromises = Promise.all(positionIds.map(async (positionId) => {
    balances[positionId] = (await pmsystem.balanceOf(owner, positionId)).toString()
    console.log(balances[positionId])
  }))
  
  await balancePromises

  return balances
}