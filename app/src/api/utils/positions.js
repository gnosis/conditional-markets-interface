import web3 from 'web3'

const { isBN, toBN, BN, soliditySha3, padLeft } = web3.utils

/**
 * Simulates addition with an overflow exactly at 255 bits. This is to emulate an (intended) behaviour in the smart contracts.
 * 
 * @param {*} a 
 * @param {*} b 
 * @returns {BN} Sum with all overflowing bits truncated
 */
const addWithOverflow = (a, b) => {
  const aBN = isBN(a) ? a : toBN(a)
  const bBN = isBN(b) ? b : toBN(b)

  const aBinary = aBN.toString(2).slice(-256)
  const bBinary = bBN.toString(2).slice(-256)

  const product = (new BN(aBinary, 2).add(
    new BN(bBinary, 2)
  ))

  const productTrunctated = new BN(product.toString(2), 2).toString(2).slice(-256)

  return new BN(productTrunctated, 2)
}

/**
 * Turns multiple outcome index positions into a bitfield including all indexes
 * @param {*} indexes 
 * @param {*} marketOutcomeCount 
 */
const outcomeIndexesToBitField = (indexes, marketOutcomeCount) => (
  indexes
    .map((index) => 1 << index % marketOutcomeCount)
    .reduce((acc, indexSet) => indexSet | acc, 0)
    .toString(2))

/**
 * Generates a positionId hash for the selected outcome index
 * 
 * @param {Array} markets 
 * @param {TruffleContract} collateral 
 * @param {number} i 
 */
export const generatePositionId = (markets, collateral, i) => {
  // from smart contract:
  /*
    uint collectionId = 0;

    for(uint k = 0; k < conditionIds.length; k++) {
        uint curOutcomeSlotCount = pmSystem.getOutcomeSlotCount(conditionIds[k]);
        collectionId += uint(keccak256(abi.encodePacked(
            conditionIds[k],
            1 << (i % curOutcomeSlotCount))));
        i /= curOutcomeSlotCount;
    }
    return uint(keccak256(abi.encodePacked(
        collateralToken,
        collectionId)));
  */
  let collectionId = new BN(0)
  markets.forEach((market) => {
    const outcomeIndexes = (Array.isArray(i) ? (
      outcomeIndexesToBitField(i, market.outcomes.length)
    ) : (1 << (i % market.outcomes.length).toString(2)))
    
    const collectionIdBytes = [
      market.conditionId.slice(2),
      padLeft(outcomeIndexes, 64).slice(2)
    ].join('')

    const anotherCollectionId = new BN(
      soliditySha3({
        t: 'bytes', v: collectionIdBytes
      }).slice(2),
    16)

    // needed to replicate the behaviour in the smart contract
    collectionId = addWithOverflow(collectionId, anotherCollectionId)

    i = Math.floor(i / market.outcomes.length)
  })

  const positionIdBytes = [
    collateral.address.slice(2),
    collectionId.toString(16)
  ].join('')

  return soliditySha3(
    { t: 'bytes', v: positionIdBytes }
  )
}
