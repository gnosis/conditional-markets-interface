const ContractLoader = require("./utils/ContractLoader");
import { loadWeb3 } from "utils/web3";

const conf = require("./conf");

let contracts;
/**
 * Loads the contracts into an instance.
 * @return {Object} A dictionary object containing the instances of the contracts.
 */
async function loadContracts() {
  if (!contracts) {
    const { lmsrAddress, networkId } = conf;

    const { web3 } = await loadWeb3(networkId);

    // Load application contracts
    const contractLoader = new ContractLoader({ lmsrAddress, web3 });
    contracts = await contractLoader.loadContracts();
  }

  return contracts;
}

export default loadContracts;
