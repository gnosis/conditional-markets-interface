const deployConfig = require("./utils/deploy-config");

module.exports = function(deployer) {
  deployer.deploy(
    artifacts.require("DaiStabilityFeeOracle"),
    artifacts.require("PredictionMarketSystem").address,
    deployConfig.daiStabilityFeeResolutionTime,
    deployConfig.daiStabilityFeeTargetValue,
    deployConfig.daiStabilityFeeQuestionID,
    artifacts.require("DaiTubStandin").address
  );
};
