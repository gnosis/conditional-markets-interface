module.exports = function(deployer) {
  deployer.deploy(artifacts.require("DaiStandin"), { overwrite: false });
};
