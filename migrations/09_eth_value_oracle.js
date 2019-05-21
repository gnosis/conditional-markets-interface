module.exports = function(deployer) {
  let medianizerAddress;
  try {
    medianizerAddress = artifacts.require("Medianizer").address;
  } catch (e) {
    medianizerAddress = artifacts.require("TestMedianizer").address;
  }
  deployer.deploy(
    artifacts.require("ETHValueOracle"),
    artifacts.require("PredictionMarketSystem").address,
    medianizerAddress,
    process.env.O3STARTBLOCK || 1,
    process.env.O3ENDBLOCK || 1e10,
    process.env.O3TARGET || 10,
    process.env.O3QUESTIONID || "0x03"
  );
};
