const deployConfig = require("./utils/deploy-config");

module.exports = function(deployer) {
  deployer.deploy(
    artifacts.require("TokenSupplyOracle"),
    artifacts.require("PredictionMarketSystem").address,
    deployConfig.daiSupplyResolutionTime,
    deployConfig.daiSupplyTargetValue,
    deployConfig.daiSupplyQuestionID,
    artifacts.require("DaiStandin").address
  );
};
