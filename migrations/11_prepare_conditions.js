const deployConfig = require("./utils/deploy-config")(artifacts);
const PredictionMarketSystem = artifacts.require("PredictionMarketSystem");

module.exports = function(deployer) {
  deployer.then(async () => {
    const pmSystem = await PredictionMarketSystem.deployed();
    const markets = require("../markets.config");
    for (const { questionId } of markets) {
      await pmSystem.prepareCondition(deployConfig.oracle, questionId, 2);
    }
  });
};
