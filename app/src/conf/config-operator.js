const isProduction = process.env.NODE_ENV === "production";

const defaultOperatorApi = isProduction
  ? "https://sight-operator.staging.gnosisdev.com/api/v1"
  : "https://sight-operator.dev.gnosisdev.com/api/v1";

module.exports = {
  OPERATOR_API_URL: process.env.OPERATOR_API || defaultOperatorApi
};
