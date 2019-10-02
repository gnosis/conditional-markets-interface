const WHITELIST_ENABLED = process.env.WHITELIST_ENABLED;
const WHITELIST_API_URL = process.env.WHITELIST_API;

const getWhitelistState = async accountAddress => {
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

export default getWhitelistState;
