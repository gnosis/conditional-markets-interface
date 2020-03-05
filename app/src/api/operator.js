const conf = require("conf");
const { OPERATOR_API_URL, network } = conf;

const createQueryString = params => {
  return Object.keys(params)
    .map(key => {
      if (params[key]) {
        return key + "=" + params[key];
      }
    })
    .join("&");
};

const getQuestionsMock = () => {
  return { results: conf.markets };
};

export const getQuestions = async (status, marketMaker, limit, offset) => {
  if (network === "local") {
    return getQuestionsMock();
  }

  const apiUrl = `${OPERATOR_API_URL}/questions/`;
  const params = {
    status,
    market_maker: marketMaker,
    limit,
    offset
  };

  const queryString = createQueryString(params);

  const url = apiUrl + "?" + queryString;

  return fetch(url).then(response => {
    return response.json();
  });
};

export const getMarketMakers = async (
  status,
  factory,
  address,
  limit,
  offset
) => {
  const apiUrl = `${OPERATOR_API_URL}/market-makers/`;
  const params = {
    status,
    factory,
    address,
    limit,
    offset
  };

  const queryString = createQueryString(params);

  const url = apiUrl + "?" + queryString;

  return fetch(url).then(response => {
    return response.json();
  });
};
