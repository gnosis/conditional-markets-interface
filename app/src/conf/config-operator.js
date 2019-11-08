const isMainnet = process.env.NETWORK === "mainnet";

const defaultOperatorApi = isMainnet
  ? "https://sight-operator.staging.gnosisdev.com/api/v1"
  : "https://sight-operator.dev.gnosisdev.com/api/v1";

console.log("OPERATOR_API: ", process.env.OPERATOR_API);

module.exports = {
  OPERATOR_API_URL: process.env.OPERATOR_API || defaultOperatorApi
};
