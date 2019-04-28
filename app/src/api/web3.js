import Web3 from "web3";
import TC from "truffle-contract";

import config from "../../config.json";

let provider;
let isLocal;
if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
  provider = new Web3("http://localhost:8545");
  isLocal = true;
} else {
  if (
    typeof window.ethereum !== "undefined" &&
    typeof window.ethereum.enable !== "undefined"
  ) {
    provider = new Web3(window.ethereum);
    window.ethereum.enable();
  } else {
    provider = new Web3(window.web3.currentProvider);
  }
}

// This sets a globally available web3 instance, so certain operation can be checked easily
window.usedWeb3 = provider;

const contracts = {};

export const loadContract = async (contractName, address) => {
  const path = `${contractName}}${address}`;
  if (!contracts[path]) {
    const artifact = await import(
      /* webpackInclude: /.*\/build\/contracts\/.*\.json$/g */
      /* webpackChunkName: "contracts" */
      /* webpackMode: "lazy" */
      /* webpackPrefetch: true */

      /* webpackPreload: true */
      `../../../build/contracts/${contractName}.json`
    );
    const contract = TC(artifact);
    contract.setProvider(provider.currentProvider);

    let instance;
    if (address) {
      instance = await contract.at(address);
    } else {
      instance = await contract.deployed();
    }

    contracts[path] = instance;
  }

  return contracts[path];
};

export const getDefaultAccount = async () => {
  const allAccounts = await provider.eth.getAccounts();
  return allAccounts[0];
};

export const getAccountBalance = async account => {
  let usedAccount = account;
  if (!account) {
    usedAccount = await getDefaultAccount();
  }

  const balance = await provider.eth.getBalance(usedAccount);
  // console.log(`Balance@${usedAccount}: ${balance.toString()}`)
  return balance.toString();
};

export const getGasPrice = async () => {
  const gasPrice = await provider.eth.getGasPrice();
  // console.log(gasPrice)
  return gasPrice.toString();
};

export const getETHBalance = async () => {
  const account = await getDefaultAccount();
  const ethBalance = await provider.eth.getBalance(account);

  return ethBalance.toString();
};

const localhostRegex = /https?:\/\/localhost:*/g;
export const getNetwork = async () => {
  if (isLocal) return "GANACHE";
  if (localhostRegex.test(provider.currentProvider.host)) return "GANACHE";

  const networkId = await provider.eth.net.getId();
  switch (networkId) {
    case 1: {
      return "MAINNET";
    }
    case 2: {
      return "MORDEN";
    }
    case 3: {
      return "ROPSTEN";
    }
    case 4: {
      return "RINKEBY";
    }
    case 42: {
      return "KOVAN";
    }
    default: {
      return "UNKNOWN";
    }
  }
};

let loadedConfig;
export const loadConfig = async () => {
  if (loadedConfig) return loadedConfig;

  const network = await getNetwork();

  if (config[network]) {
    loadedConfig = config[network];
    return loadedConfig;
  }

  throw new Error(
    `Configuration has no configuration for current network: "${network}"`
  );
};
