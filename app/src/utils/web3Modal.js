import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

import conf from "conf";

let web3Modal;

if (!web3Modal) {
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

export default web3Modal;
