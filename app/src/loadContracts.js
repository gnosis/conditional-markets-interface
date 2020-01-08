const ContractLoader = require("./utils/ContractLoader");

let contracts;
/**
 * Loads the contracts into an instance.
 * @return {Object} A dictionary object containing the instances of the contracts.
 */
async function loadContracts({ lmsrAddress, web3 }) {
  if (!contracts) {
    // Load application contracts
    const contractLoader = new ContractLoader({ lmsrAddress, web3 });
    contracts = await contractLoader.loadContracts();
  }

  return contracts;
}

export default loadContracts;
