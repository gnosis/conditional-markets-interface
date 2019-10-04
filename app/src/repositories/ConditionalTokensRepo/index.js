const conf = require("../../conf");
const ConditionalTokensRepo = require("./ConditionalTokensRepo");
import loadContracts from "../../loadContracts";

let instance, instancePromise;

async function _getInstance() {
  // Get contracts
  const contracts = await loadContracts();

  // Get ethereum client
  // const getEthereumClient = require('../../helpers/ethereumClient')
  // const ethereumClient = await getEthereumClient()

  return new ConditionalTokensRepo({
    contracts
  });
}

export default async () => {
  if (!instance) {
    if (!instancePromise) {
      instancePromise = _getInstance();
    }

    instance = await instancePromise;
  }

  return instance;
};
