const defaultOperatorApi =
  "https://api.thegraph.com/subgraphs/name/gnosis/sight";

module.exports = {
  THE_GRAPH_API_URL: process.env.THE_GRAPH_API || defaultOperatorApi
};
