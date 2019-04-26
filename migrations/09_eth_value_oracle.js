module.exports = function(deployer) {
  deployer.deploy(
    artifacts.require("ETHValueOracle"),
    artifacts.require("PredictionMarketSystem").address,
    artifacts.require("Medianizer").address,
    process.env.O3STARTBLOCK || 1,
    process.env.O3ENDBLOCK || 1e9,
    process.env.O3TARGET || 10,
    process.env.O3QUESTIONID || "0x03"
  );
};
