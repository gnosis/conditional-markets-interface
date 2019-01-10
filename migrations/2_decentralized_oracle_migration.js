const pmSystem = artifacts.require('PredictionMarketSystem');

module.exports = (deployer, network) => {
    deployer.deploy(pmSystem);
}
