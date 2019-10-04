const isProduction = process.env.NODE_ENV === "production";

const defaultWhitelistEnabled = isProduction ? true : false;

const defaultWhitelistApi = isProduction
  ? "https://sight-whitelist.staging.gnosisdev.com/api/v1"
  : "/api";

module.exports = {
  WHITELIST_ENABLED: process.env.WHITELIST_ENABLED || defaultWhitelistEnabled,
  WHITELIST_API_URL: process.env.WHITELIST_API || defaultWhitelistApi
};
