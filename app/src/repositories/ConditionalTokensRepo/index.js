const ConditionalTokensRepo = require("./ConditionalTokensRepo");
import loadContracts from "../../loadContracts";

let instance, instancePromise, lmsrAddressCache;

async function _getInstance({ lmsrAddress, web3 }) {
  // Get contracts
  const contracts = await loadContracts({ lmsrAddress, web3 });

  return new ConditionalTokensRepo({
    contracts
  });
}

// When changing the market maker we have to reset the singleton
function _resetRepo() {
  instance = undefined;
  instancePromise = undefined;
}

export default async props => {
  if (props && props.lmsrAddress && props.lmsrAddress !== lmsrAddressCache) {
    // If marketMakerAddress changes we have to reload contracts
    _resetRepo();
  }

  if (!instance) {
    lmsrAddressCache = props.lmsrAddress;
    if (!instancePromise) {
      instancePromise = _getInstance(props);
    }

    instance = await instancePromise;
  }

  return instance;
};
