import { graphql, buildSchema } from "graphql";
import gql from "graphql-tag";

const conf = require("../conf");
const { THE_GRAPH_API_URL } = conf;

export const lmsrAddress = conf.lmsrAddress;

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
