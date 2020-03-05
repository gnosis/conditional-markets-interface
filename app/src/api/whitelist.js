const conf = require("../conf");
const { WHITELIST_ENABLED, WHITELIST_API_URL } = conf;

export const getWhitelistState = async accountAddress => {
  if (!WHITELIST_ENABLED) {
    return true;
  }

  const response = await fetch(`${WHITELIST_API_URL}/users/${accountAddress}/`);
  if (response.status === 404) {
    return "NOT_FOUND";
  }

  if (!response.ok) {
    return "ERROR";
  }

  const json = await response.json();

  return json.status; // 'PENDING_KYC', 'BLOCKED', 'WHITELISTED'
};

export const setSourceOfFunds = async sowInformation => {
  const { email, ...data } = sowInformation;
  const url = `${WHITELIST_API_URL}/users/${email}/sow`;

  return fetch(url, {
    method: "POST",
    body: JSON.stringify(data), // data can be `string` or {object}!
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getCurrentTradingVolume = accountAddress => {
  return Math.floor(Math.random() * 151);
};
