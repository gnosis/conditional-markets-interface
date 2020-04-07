import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

import conf from "conf";

let web3Modal;
let lmsrAddressCache = null;

const getWeb3Modal = lmsrAddress => {
  if (lmsrAddressCache !== lmsrAddress || !web3Modal) {
    lmsrAddressCache = lmsrAddress;
    web3Modal = new Web3Modal({
      network: conf.network,
      cacheProvider: true,
      providerOptions: {
        walletconnect: {
          package: WalletConnectProvider,
          options: {
            infuraId: conf.infuraApiKey
          }
        }
      }
    });
  }

  return web3Modal;
};

export default getWeb3Modal;
