const sumsubWebSdk =
  process.env.NETWORK === "rinkeby"
    ? "https://test-api.sumsub.com/idensic/static/sumsub-kyc.js"
    : "https://api.sumsub.com/idensic/static/sumsub-kyc.js";

module.exports = {
  WHITELIST_API_URL: process.env.WHITELIST_API,
  ONBOARDING_MODE: process.env.ONBOARDING_MODE.toUpperCase(),
  SUMSUB_WEB_SDK: sumsubWebSdk
};
