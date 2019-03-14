const Web3 = require("web3");
const TC = require("truffle-contract");

let contractCache = {}

const loadProvider = () => {
  const provider = new Web3("http://localhost:8545");
  if (typeof provider.enable === 'function') provider.enable()
  return provider
}

/**
 * NodeJS/Jest compatible loadContract method
 * 
 * @param {String} contractName - Name of Artifact, this will be searched for in the contract
 * @param {String=} address - Address of contract instance that you want to load, otherwise will look for deployed instance
 */
const loadContract = async (contractName, address) => {
  const identifier = address != null ? address : "deployed"
  if (contractCache[contractName] && contractCache[contractName][identifier]) return contractCache[contractName][identifier]
  if (!contractCache[contractName]) contractCache[contractName] = {}

  const artifact = require(`./../../../../build/contracts/${contractName}.json`)
  const provider = loadProvider()

  const contract = new TC(artifact)
  contract.setProvider(provider.currentProvider)
  
  let instance
  if (address != null) {
    instance = await contract.at(address)
  } else {
    instance = await contract.deployed()
  }

  contractCache[contractName][identifier] = instance
  return instance
}

module.exports = { loadContract }