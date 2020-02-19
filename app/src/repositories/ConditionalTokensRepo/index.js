const ConditionalTokensRepo = require("./ConditionalTokensRepo");
import loadContracts from "../../loadContracts";

let instance, instancePromise, lmsrAddressCache, providerAccountCache;

async function _getInstance({ lmsrAddress, web3, account }) {
  // Get contracts
  const contracts = await loadContracts({ lmsrAddress, web3, account });

  return new ConditionalTokensRepo({ contracts });
}

// When changing the market maker or the web3 provider we have to reset the singleton
function _resetRepo() {
  instance = undefined;
  instancePromise = undefined;
}

export default async props => {
  if (
    props &&
    ((props.lmsrAddress && props.lmsrAddress !== lmsrAddressCache) ||
      props.account !== providerAccountCache)
  ) {
    // If marketMakerAddress or web3 provider changes we have to reload contracts
    _resetRepo();
  }

  if (!instance) {
    lmsrAddressCache = props.lmsrAddress;
    providerAccountCache = props.account;
    if (!instancePromise) {
      instancePromise = _getInstance(props);
    }

    instance = instancePromise;
  }

  return instance;
};
