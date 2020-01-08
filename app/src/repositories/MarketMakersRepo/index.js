const MarketMakersRepo = require("./MarketMakersRepo");
import loadContracts from "../../loadContracts";

let instance, instancePromise;

async function _getInstance({ lmsrAddress, web3 }) {
  // Get contracts
  const contracts = await loadContracts({ lmsrAddress, web3 });

  return new MarketMakersRepo({ contracts });
}

export default async props => {
  if (!instance) {
    if (!instancePromise) {
      instancePromise = _getInstance(props);
    }

    instance = await instancePromise;
  }

  return instance;
};
