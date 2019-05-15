module.exports = function(deployer) {
  if (artifacts.require("Medianizer").address == null)
    deployer.deploy(artifacts.require("TestMedianizer"));
};
