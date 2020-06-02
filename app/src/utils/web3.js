export function getNetworkName(networkId) {
  // https://ethereum.stackexchange.com/a/17101
  return (
    {
      [0]: "Olympic",
      [1]: "Mainnet",
      [2]: "Morden Classic",
      [3]: "Ropsten",
      [4]: "Rinkeby",
      [5]: "Goerli",
      [6]: "Kotti Classic",
      [8]: "Ubiq",
      [42]: "Kovan",
      [60]: "GoChain",
      [77]: "Sokol",
      [99]: "Core",
      [100]: "xDai",
      [31337]: "GoChain testnet",
      [401697]: "Tobalaba",
      [7762959]: "Musicoin",
      [61717561]: "Aquachain"
    }[networkId] || `Network ID ${networkId}`
  );
}

export function getReadOnlyProviderForNetworkId(networkId) {
  const providerName = {
    [1]: "mainnet",
    [3]: "ropsten",
    [4]: "rinkeby",
    [5]: "goerli",
    [42]: "kovan"
  }[networkId];

  return providerName == null
    ? null
    : `wss://${providerName}.infura.io/ws/v3/bd80e0d6a7254439a294b8ca04e2b66d`;
}

export async function getAccount(web3) {
  if (!web3) return null;
  if (web3.defaultAccount == null) {
    const accounts = await web3.eth.getAccounts();
    return accounts[0] || null;
  } else return web3.defaultAccount;
}

export async function tryProvider(providerCandidate, networkId) {
  const { default: Web3 } = await import("web3");

  if (providerCandidate == null) throw new Error("provider not available");
  if (providerCandidate.enable != null) await providerCandidate.enable();

  const web3 = new Web3(providerCandidate);
  const web3NetworkId = await web3.eth.net.getId();
  if (web3NetworkId != networkId)
    throw new Error(
      `Please connect to the correct network: ${getNetworkName(
        networkId
      )} (currently connected to ${getNetworkName(web3NetworkId)})`
    );

  // attempt to get the main account here
  // so that web3 will emit an error if e.g.
  // the localhost provider cannot be reached
  const account = await getAccount(web3);

  return { web3, account };
}

export async function loadWeb3(networkId, provider) {
  // const { default: Web3 } = await import("web3");
  const web3InitErrors = [];
  let web3, account;
  let foundWeb3 = false;

  for (const [providerType, providerCandidate] of [
    //["injected web3", window["web3"] && window["web3"]["currentProvider"]],
    ["web3connect provider", provider],
    [
      `read-only for id ${networkId}`,
      getReadOnlyProviderForNetworkId(networkId)
    ]
  ]) {
    try {
      const candidateEvaluated =
        typeof providerCandidate === "function"
          ? providerCandidate()
          : providerCandidate;
      const providerValues = await tryProvider(candidateEvaluated, networkId);
      foundWeb3 = true;
      web3 = providerValues.web3;
      account = providerValues.account;
      // eslint-disable-next-line
      console.info(
        `Web3 connection established. Using ${providerType} on network ${getNetworkName(
          networkId
        )}`
      );
      break;
    } catch (e) {
      web3InitErrors.push([providerType, e]);
    }
  }

  if (!foundWeb3)
    throw new Error(
      `could not get valid Web3 instance; got following errors:\n${web3InitErrors
        .map(([providerCandidate, e]) => `${providerCandidate} -> ${e}`)
        .join("\n")}`
    );

  return { web3, account };
}
