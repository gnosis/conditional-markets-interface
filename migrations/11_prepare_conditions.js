const deployConfig = require("./utils/deploy-config");

module.exports = function(deployer) {
  deployer.then(async () => {
    const pmSystem = await artifacts
      .require("PredictionMarketSystem")
      .deployed();
    await pmSystem.prepareCondition(
      artifacts.require("DutchXTokenPriceOracle").address,
      deployConfig.daiPriceQuestionID,
      2
    );
    await pmSystem.prepareCondition(
      artifacts.require("TokenSupplyOracle").address,
      deployConfig.daiSupplyQuestionID,
      2
    );
    await pmSystem.prepareCondition(
      artifacts.require("DaiStabilityFeeOracle").address,
      deployConfig.daiStabilityFeeQuestionID,
      2
    );
  });
};
