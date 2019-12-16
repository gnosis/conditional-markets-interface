const defaultGraphApi =
  process.env.NETWORK === "rinkeby"
    ? "https://api.thegraph.com/subgraphs/name/gnosis/conditional-tokens-rinkeby"
    : "https://api.thegraph.com/subgraphs/name/gnosis/conditional-tokens";

module.exports = {
  THE_GRAPH_API_URL: process.env.THE_GRAPH_API || defaultGraphApi
};
