module.exports = function(deployer) {
  deployer.then(async () => {
    const pmSystem = await artifacts
      .require("PredictionMarketSystem")
      .deployed();
    await pmSystem.prepareCondition(
      artifacts.require("DifficultyOracle").address,
      process.env.O1QUESTIONID || "0x01",
      2
    );
    await pmSystem.prepareCondition(
      artifacts.require("GasLimitOracle").address,
      process.env.O2QUESTIONID || "0x02",
      2
    );
    await pmSystem.prepareCondition(
      artifacts.require("ETHValueOracle").address,
      process.env.O2QUESTIONID || "0x03",
      2
    );
  });
};
