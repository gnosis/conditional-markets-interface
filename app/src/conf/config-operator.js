const isProduction = process.env.NODE_ENV === "production";

// const defaultWhitelistEnabled = isProduction ? true : false;

const defaultOperatorApi = "https://sight-operator.dev.gnosisdev.com/api/v1"
// isProduction
//   ? "https://sight-operator.staging.gnosisdev.com/api/v1"
//   : "/api";

module.exports = {
  // WHITELIST_ENABLED: process.env.WHITELIST_ENABLED || defaultWhitelistEnabled,
  OPERATOR_API_URL: process.env.OPERATOR_API || defaultOperatorApi
};
