module.exports = function(deployer) {
  // For some reason, Truffle errors when trying
  //
  //     deployer.deploy(artifacts.require("DutchXStandin"), { overwrite: false });
  //
  // even though pattern works in other instances???

  const DutchXStandin = artifacts.require("DutchXStandin");
  try {
    // accessor throws an error if address hasn't been set on current network
    DutchXStandin.address;
  } catch (e) {
    deployer.deploy(DutchXStandin);
  }
};
