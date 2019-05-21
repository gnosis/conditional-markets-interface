module.exports = function(deployer) {
  try {
    artifacts.require("Medianizer").address;
  } catch (e) {
    deployer.deploy(artifacts.require("TestMedianizer"));
  }
};
