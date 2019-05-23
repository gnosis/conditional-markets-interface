const deployConfig = require("./utils/deploy-config");

module.exports = function(deployer) {
  deployer.deploy(
    artifacts.require("DutchXTokenPriceOracle"),
    artifacts.require("PredictionMarketSystem").address,
    deployConfig.daiPriceResolutionTime,
    deployConfig.daiPriceTargetValue,
    deployConfig.daiPriceQuestionID,
    artifacts.require("DutchXStandin").address,
    artifacts.require("DaiStandin").address
  );
};
