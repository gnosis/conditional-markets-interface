const ContractLoader = require("./utils/ContractLoader");
import { getAccount } from "./utils/web3";

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
async function loadContracts({ lmsrAddress, web3 }) {
  const providerAccount = await getAccount(web3);
  if (
    lmsrAddress !== lmsrAddressCache ||
    providerAccount !== providerAccountCache
  ) {
    // If marketMakerAddress or web3 provider changes we have to reload contracts
    _resetContracts();
  }

  if (!contracts) {
    lmsrAddressCache = lmsrAddress;
    providerAccountCache = providerAccount;
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
