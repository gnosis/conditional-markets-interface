import web3 from 'web3'
const { BN } = web3.utils

const ONE_ETH = (new BN(10)).pow(new BN(18))

const DECIMALS = 8
const DECIMAL_MUL = (new BN(10)).pow(new BN(DECIMALS))

export const formatEther = (bnString) => {
  const bn = (new BN(bnString)).mul(DECIMAL_MUL)
  const num = bn.div(ONE_ETH.mul(DECIMAL_MUL)).toNumber() / (Math.pow(10, DECIMALS))

  const isSmallerThanLowest = num <= Math.pow(10, -DECIMALS)

  return `${isSmallerThanLowest ? "<" : ""} ${num.toFixed(8)} Ξ`
}