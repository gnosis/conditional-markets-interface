import gql from "graphql-tag";
import { ApolloClient } from "apollo-client";
// import { createHttpLink } from "apollo-link-http";
import { WebSocketLink } from "apollo-link-ws";
import { SubscriptionClient } from "subscriptions-transport-ws";
import { InMemoryCache } from "apollo-cache-inmemory";

const conf = require("../conf");
const { THE_GRAPH_SUBSCRIPTION_URL } = conf;

// 2
// This should be enabled in future if we explicitly need http queries
// We should also use "split" from apollo-link to handle http or ws link for each query
// const httpLink = createHttpLink({
//   uri: THE_GRAPH_API_URL
// });

// Websocket link
const wsClient = new SubscriptionClient(THE_GRAPH_SUBSCRIPTION_URL, {
  reconnect: true
});
const wsLink = new WebSocketLink(wsClient);

// 3
export const client = new ApolloClient({
  link: wsLink,
  cache: new InMemoryCache()
});

// {
//   outcomeTokenTrades {
//     id
//     count
//     transactor
//     outcomeTokenAmounts
//     outcomeTokenNetCost
//     marketFees
//     outcomeSlotCount
//     marketMakerMarginalPrices
//     blockTimestamp
//     blockNumber
//     marketMaker
//     marketMakerOwner
//   }
//   marketMakers {
//     id
//     creator
//     marketMaker
//     pmSystem
//     collateralToken
//     conditionIds
//     fee
//     funding
//   }
// }
export const GET_TRADES_BY_MARKET_MAKER = gql`
  subscription GetTradesByMarketMaker($marketMaker: Bytes) {
    outcomeTokenTrades(
      first: 1000
      where: { marketMaker: $marketMaker }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      outcomeSlotCount
      marketMakerMarginalPrices
      blockTimestamp
      blockNumber
      marketMaker
    }
  }
`;
