module.exports = function(deployer) {
  deployer.deploy(
    artifacts.require("GasLimitOracle"),
    artifacts.require("PredictionMarketSystem").address,
    process.env.O2STARTBLOCK || 1,
    process.env.O2ENDBLOCK || 1e10,
    process.env.O2TARGET || 10,
    process.env.O2QUESTIONID || "0x02"
  );
};
