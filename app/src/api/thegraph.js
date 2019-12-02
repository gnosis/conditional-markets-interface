import { graphql, buildSchema } from 'graphql';

const conf = require("../conf");
const { THE_GRAPH_API_URL } = conf;

const createQueryString = params => {
  return Object.keys(params)
    .map(key => {
      if (params[key]) {
        return key + "=" + params[key];
      }
    })
    .join("&");
};

export const getTrades = async (lmsrAddress, marketMaker, limit, offset) => {
  const apiUrl = `${THE_GRAPH_API_URL}`;
  const query = {
    id
    count
    transactor
    outcomeTokenAmounts
    outcomeTokenNetCost
    marketFees
    outcomeSlotCount
    marketMakerMarginalPrices
    lmsrMarketMaker
    lmsrMarketMakerOwner
    blockTimestamp
    blockNumber
  };

  const url = apiUrl;

  return fetch(url, {
    method: "POST", // or 'PUT'
    body: JSON.stringify(query)
  }).then(response => {
    return response.json();
  });
};

// export const getMarketMakers = async (
//   status,
//   factory,
//   address,
//   limit,
//   offset
// ) => {
//   const apiUrl = `${THE_GRAPH_API_URL}/market-makers/`;
//   const params = {
//     status,
//     factory,
//     address,
//     limit,
//     offset
//   };

//   const queryString = createQueryString(params);

//   const url = apiUrl + "?" + queryString;

//   return fetch(url).then(response => {
//     return response.json();
//   });
// };
