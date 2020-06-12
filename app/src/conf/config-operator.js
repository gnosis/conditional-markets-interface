const isMainnet = process.env.NETWORK === "mainnet";

const defaultOperatorApi = isMainnet
  ? "https://sight-operator.staging.gnosisdev.com/api"
  : "https://sight-operator.dev.gnosisdev.com/api";

module.exports = {
  OPERATOR_API_URL: process.env.OPERATOR_API || defaultOperatorApi
};
