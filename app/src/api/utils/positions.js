import web3 from 'web3'
import { asAddress, asBytes32, addWithOverflow } from '../../utils/solidity'
const { BN, soliditySha3 } = web3.utils

/**
 * Generates atomic Position-IDs according to smart contract implementation
 * 
 * @param {[Market]} markets - Array of Markets, must contain atleast `conditionId`
 * @param {TruffleContract|Object} collateral - TruffleContract instance or object containing `address`
 * @param {*} i - Outcome Index of the Position-ID to be generated
 */
export const generatePositionId = (markets, collateral, i) => {
  let collectionId = new BN(0)
  markets.forEach((market) => {
    const anotherCollectionId = new BN(
      soliditySha3({
        t: 'bytes32', v: asBytes32(market.conditionId),
      }, {
        t: 'bytes32', v: asBytes32(1 << (i % market.outcomes.length))
      }).slice(2),
    16)

    // needed to replicate the behaviour in the smart contract
    collectionId = addWithOverflow(collectionId, anotherCollectionId)

    i = Math.floor(i / market.outcomes.length)
  })

  return soliditySha3(
    { t: 'address', v: asAddress(collateral.address) },
    { t: 'bytes32', v: asBytes32(collectionId) }
  )
}

export const getAmountOfOutcomeCombinations = (numOutcomesPerMarket) => {
  return numOutcomesPerMarket.reduce((acc, numOfOutcomes) => acc * numOfOutcomes.length, 1)
}