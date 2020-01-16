const ConditionalTokensRepo = require("./ConditionalTokensRepo");
import loadContracts from "../../loadContracts";
import { getAccount } from "../../utils/web3";
let instance, instancePromise, lmsrAddressCache, providerAccountCache;

async function _getInstance({ lmsrAddress, web3 }) {
  // Get contracts
  const contracts = await loadContracts({ lmsrAddress, web3 });

  return new ConditionalTokensRepo({
    contracts
  });
}

// When changing the market maker or the web3 provider we have to reset the singleton
function _resetRepo() {
  instance = undefined;
  instancePromise = undefined;
}

export default async props => {
  const providerAccount = await getAccount(props.web3);
  if (
    props &&
    ((props.lmsrAddress && props.lmsrAddress !== lmsrAddressCache) ||
      providerAccount !== providerAccountCache)
  ) {
    // If marketMakerAddress or web3 provider changes we have to reload contracts
    _resetRepo();
  }

  if (!instance) {
    lmsrAddressCache = props.lmsrAddress;
    providerAccountCache = providerAccount;
    if (!instancePromise) {
      instancePromise = _getInstance(props);
    }

    instance = await instancePromise;
  }

  return instance;
};
