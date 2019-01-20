import Web3 from 'web3'
import TC from 'truffle-contract'

let provider
if (process.env.NODE_ENV === 'development') {
  console.log('Using ganache because "NODE_ENV" is in development mode.')
  provider = new Web3('http://localhost:8545')
  //provider.eth.net.getId().then(console.log)
} else {
  provider = new Web3(window.web3.currentProvider)
}

if (provider.enable) {
  provider.enable()
}

const contracts = {}

export const loadContract = async (contractName, address) => {
  const path = `${contractName}}${address}`
  if (!contracts[path]) {
    const artifact = await import(
      /* webpackInclude: /.*\/build\/contracts\/.*\.json$/g */
      /* webpackChunkName: "contracts" */
      /* webpackMode: "lazy" */
      /* webpackPrefetch: true */ 
      /* webpackPreload: true */
      `../../../build/contracts/${contractName}.json`
    )
    const contract = TC(artifact)
    contract.setProvider(provider.currentProvider)

    let instance
    if (address) {
      instance = await contract.at(address)
      console.log(`Loading ${contractName}@${address}`)
      console.log(instance)
    } else {
      instance = await contract.deployed()
      console.log(`Loading ${contractName}@deployed`)
      console.log(instance)
    }
  
    contracts[path] = instance
  }

  return contracts[path]
}

export const getDefaultAccount = async () => {
  const allAccounts = await provider.eth.getAccounts()
  return allAccounts[0]
}