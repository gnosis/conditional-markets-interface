import gql from "graphql-tag";
import { ApolloClient } from "apollo-client";
import { createHttpLink } from "apollo-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";

const conf = require("../conf");
const { THE_GRAPH_API_URL } = conf;

export const lmsrAddress = conf.lmsrAddress;

// 2
const httpLink = createHttpLink({
  uri: THE_GRAPH_API_URL
});

// 3
export const client = new ApolloClient({
  link: httpLink,
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
export const getTrades = gql`
  {
    outcomeTokenTrades {
      id
      outcomeSlotCount
      marketMakerMarginalPrices
      blockTimestamp
      blockNumber
      marketMaker
    }
  }
`;
