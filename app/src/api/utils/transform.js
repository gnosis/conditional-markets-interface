import web3 from 'web3'

const { BN, soliditySha3 } = web3.utils

const colors = ["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc","#e5d8bd","#fddaec","#f2f2f2"]


const transformMarketEntries = async (markets, pmSystems, lmsr, collateral) => {
  const outcomeSlotCount = (await lmsr.atomicOutcomeSlotCount()).toNumber()
  const outcomePrices = await Promise.all(Array(outcomeSlotCount).fill().map(async (_, index) => (
    (await lmsr.calcMarginalPrice(index))
  )))

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
      const outcomePrice = outcomePrices[lmsrOutcomeIndex++]
      if (outcomePrice) {
        const probability = (outcomePrice / marginalPricesPerMarket[marketIndex])

        console.log({ collateral: collateral.address, conditionId: market.conditionId})
        const positionId = soliditySha3(
          { t: 'address', v: collateral.address },
          { t: 'bytes32', v: soliditySha3(
            { t: 'bytes32', v: "0" },
            { t: 'bytes32', v: market.conditionId },
            { t: 'uint', v: 1 << lmsrOutcomeIndex },
          )}
        )
        console.log({ positionId })

        return {
          name: outcome,
          probability,
          price: outcomePrice.div(new BN(2).pow(new BN(18))).toNumber(),
          positionId,
          color: colors[lmsrOutcomeIndex]
        }
      }
    })
  }))
}

export default transformMarketEntries