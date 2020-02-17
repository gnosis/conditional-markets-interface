import ContractLoader from "./utils/ContractLoader";

let contracts, contractsPromise, lmsrAddressCache, providerAccountCache;
function _resetContracts() {
  contracts = undefined;
  contractsPromise = undefined;
  lmsrAddressCache = undefined;
  providerAccountCache = undefined;
}
/**
 * Loads the contracts into an instance.
 * @return {Object} A dictionary object containing the instances of the contracts.
 */
async function loadContracts({ lmsrAddress, web3, account }) {
  if (lmsrAddress !== lmsrAddressCache || account !== providerAccountCache) {
    // If marketMakerAddress or web3 provider changes we have to reload contracts
    _resetContracts();
  }

  if (!contracts) {
    lmsrAddressCache = lmsrAddress;
    providerAccountCache = account;
    if (!contractsPromise) {
      // Load application contracts
      const contractLoader = new ContractLoader({ lmsrAddress, web3 });
      contractsPromise = await contractLoader.loadContracts();
    }

    contracts = await contractsPromise;
  }

  return contracts;
}

export default loadContracts;
