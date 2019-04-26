module.exports = function(deployer) {
  deployer.deploy(
    artifacts.require("DifficultyOracle"),
    artifacts.require("PredictionMarketSystem").address,
    process.env.O1SSTARTBLOCK || 1,
    process.env.O1ENDBLOCK || 1e9,
    process.env.O1TARGET || 10,
    process.env.O1QUESTIONID || "0x01"
  );
};
