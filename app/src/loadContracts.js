const ContractLoader = require("./utils/ContractLoader");

let contracts, contractsPromise, lmsrAddressCache;
function _resetContracts() {
  contracts = undefined;
  contractsPromise = undefined;
  lmsrAddressCache = undefined;
}
/**
 * Loads the contracts into an instance.
 * @return {Object} A dictionary object containing the instances of the contracts.
 */
async function loadContracts({ lmsrAddress, web3 }) {
  if (lmsrAddress !== lmsrAddressCache) {
    // If marketMakerAddress changes we have to reload contracts
    _resetContracts();
  }

  if (!contracts) {
    lmsrAddressCache = lmsrAddress;
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
