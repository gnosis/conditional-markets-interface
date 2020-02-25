const defaultGraphApi =
  process.env.NETWORK === "rinkeby"
    ? "https://api.thegraph.com/subgraphs/name/gnosis/conditional-tokens-rinkeby"
    : "https://api.thegraph.com/subgraphs/name/gnosis/conditional-tokens";

const defaultGraphSubscription =
  process.env.NETWORK === "rinkeby"
    ? "wss://api.thegraph.com/subgraphs/name/gnosis/conditional-tokens-rinkeby"
    : "wss://api.thegraph.com/subgraphs/name/gnosis/conditional-tokens";

module.exports = {
  THE_GRAPH_API_URL: process.env.THE_GRAPH_API || defaultGraphApi,
  THE_GRAPH_SUBSCRIPTION_URL:
    process.env.THE_GRAPH_SUBSCRIPTION || defaultGraphSubscription
};
