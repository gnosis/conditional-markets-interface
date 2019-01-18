import { getDefaultAccount } from './web3'

import web3 from 'web3'

const { toBN } = web3.utils

export const retrieveBalances = async (pmsystem) => {
  const owner = await getDefaultAccount()

  // retrieve all events
  const buyEventsPromise = pmsystem.getPastEvents("TransferSingle", { fromBlock: 0, toBlock: 'latest', filter: { _to: owner }})
  const sellEventsPromise = pmsystem.getPastEvents("TransferSingle", { fromBlock: 0, toBlock: 'latest', filter: { _from: owner }})

  // wait for both promises
  const [buyEvents, sellEvents] = await Promise.all([buyEventsPromise, sellEventsPromise])

  // retrieve ids of events
  const positionIds = [...buyEvents, ...sellEvents]
    .map((logEntry) => logEntry.args._id)
    
  // remove duplicates
  const positionIdsUniq = positionIds.filter((id, i) => positionIds.indexOf(id) <= i)

  // get position balances
  const balances = {}

  const balancePromises = Promise.all(positionIdsUniq.map(async (id) => {
    const positionId = `0x${(toBN(id).toString(16))}`
    balances[positionId] = (await pmsystem.balanceOf(owner, id)).toString()
  }))

  await balancePromises

  return balances
}