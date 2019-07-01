/*
 * These are helper functions used for access and interacting with web3.
 */

export function getNetworkName(networkId) {
  // https://ethereum.stackexchange.com/a/17101
  return (
    {
      "0": "Olympic",
      "1": "Mainnet",
      "2": "Morden Classic",
      "3": "Ropsten",
      "4": "Rinkeby",
      "5": "Goerli",
      "6": "Kotti Classic",
      "8": "Ubiq",
      "42": "Kovan",
      "60": "GoChain",
      "77": "Sokol",
      "99": "Core",
      "100": "xDai",
      "31337": "GoChain testnet",
      "401697": "Tobalaba",
      "7762959": "Musicoin",
      "61717561": "Aquachain"
    }[String(networkId)] || `Network ID ${networkId}`
  );
}

export function getReadOnlyProviderForNetworkId(networkId) {
  const providerName = {
    "1": "mainnet",
    "3": "ropsten",
    "4": "rinkeby",
    "5": "goerli",
    "42": "kovan"
  }[String(networkId)];

  return providerName == null
    ? null
    : `wss://${providerName}.infura.io/ws/v3/d743990732244555a1a0e82d5ab90c7f`;
}

export async function loadWeb3(networkId) {
  const { default: Web3 } = await import("web3");

  const web3InitErrors = [];
  let web3;
  let account;
  let foundWeb3 = false;
  for (const [providerType, providerCandidate] of [
    ["injected provider", Web3.givenProvider],
    ["local websocket", "ws://localhost:8546"],
    ["local http", "http://localhost:8545"],
    [
      `read-only for id ${networkId}`,
      getReadOnlyProviderForNetworkId(networkId)
    ]
  ]) {
    console.log("providerCandidate:", providerCandidate);
    try {
      if (providerCandidate == null) {
        throw new Error("no provider found");
      }
      if (providerCandidate.enable != null) {
        await providerCandidate.enable();
      }

      web3 = new Web3(providerCandidate);
      const web3NetworkId = await web3.eth.net.getId();
      if (web3NetworkId !== networkId) {
        throw new Error(
          `interface expects ${networkId} but currently connected to ${web3NetworkId}`
        );
      }

      // attempt to get the main account here
      // so that web3 will emit an error if e.g.
      // the localhost provider cannot be reached
      if (web3.defaultAccount == null) {
        const accounts = await web3.eth.getAccounts();
        account = accounts[0] || null;
      } else {
        account = web3.defaultAccount;
      }

      foundWeb3 = true;
      break;
    } catch (e) {
      web3InitErrors.push([providerType, e]);
    }
  }

  if (!foundWeb3) {
    throw new Error(
      `could not get valid Web3 instance; got following errors:\n${web3InitErrors
        .map(([providerCandidate, e]) => `${providerCandidate} -> ${e}`)
        .join("\n")}`
    );
  }

  return { web3, account };
}
