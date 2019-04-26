const Fixed192x64Math = artifacts.require("Fixed192x64Math");
const LMSRMarketMakerFactory = artifacts.require("LMSRMarketMakerFactory");

module.exports = function(deployer) {
  deployer.link(Fixed192x64Math, LMSRMarketMakerFactory);
  deployer.deploy(LMSRMarketMakerFactory);
};
