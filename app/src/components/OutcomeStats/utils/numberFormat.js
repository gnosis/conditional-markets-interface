import web3 from 'web3'
const { BN } = web3.utils

export const formatEther = (bnString) => {
  const bn = new BN(bnString)
  const num = bn.toNumber()

  const eth = num / 1e18

  const isSmallerThanLowest = eth <= 1e-8

  return `${isSmallerThanLowest ? "<" : ""} ${eth.toFixed(8)} Ξ`
}