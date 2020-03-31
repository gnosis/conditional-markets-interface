import ContractLoader from "./utils/ContractLoader";

let contractLoader,
  contracts,
  contractsPromise,
  lmsrAddressCache,
  providerAccountCache;

function _resetContracts() {
  contractLoader = undefined;
  contracts = undefined;
  contractsPromise = undefined;
  lmsrAddressCache = undefined;
  providerAccountCache = undefined;
}

function _updateContracts(web3) {
  contracts = undefined;
  contractsPromise = undefined;

  contractLoader.setWeb3Instance(web3);
}
/**
 * Loads the contracts into an instance.
 * @return {Object} A dictionary object containing the instances of the contracts.
 */
async function loadContracts({
  lmsrAddress,
  web3,
  account,
  collateralTokenAddress
}) {
  if (lmsrAddress !== lmsrAddressCache) {
    // If marketMakerAddress or web3 provider changes we have to reload contracts
    _resetContracts();
  }

  if (contractLoader && account !== providerAccountCache) {
    _updateContracts(web3);
  }
  if (!contracts) {
    lmsrAddressCache = lmsrAddress;
    providerAccountCache = account;
    if (!contractsPromise) {
      // Load application contracts
      if (!contractLoader) {
        contractLoader = new ContractLoader({
          lmsrAddress,
          web3,
          collateralTokenAddress
        });
      }
      contractsPromise = contractLoader.loadContracts();
    }

    contracts = contractsPromise;
  }

  return contracts;
}

export default loadContracts;
