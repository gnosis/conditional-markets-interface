const PredictionMarketSystem = artifacts.require('PredictionMarketSystem');
const DifficultyBlockOracle = artifacts.require('DifficultyBlockOracle');
const ETHValueBlockOracle = artifacts.require('ETHValueBlockOracle');
const GasLimitBlockOracle = artifacts.require('GasLimitBlockOracle');

module.exports = (deployer, network) => {
    if (network === 'development') {
        deployer.deploy(PredictionMarketSystem).then(async (pmSystem) => {
            await deployer.deploy(DifficultyBlockOracle, pmSystem.address, 1, 1e9, "0x01");
            await deployer.deploy(GasLimitBlockOracle, pmSystem.address, 1, 1e9, "0x02");
            // deployer.deploy(ETHValueBlockOracle, pmSystem.address, 1, 1e9, "0x01");
        });
    } else if (network === 'rinkeby') {
        const medianizerAddr = '0xbfFf80B73F081Cc159534d922712551C5Ed8B3D3';
        deployer.deploy(PredictionMarketSystem).then(async (pmSystem) => {
            await deployer.deploy(DifficultyBlockOracle, pmSystem.address, 1, 1e9, "0x01");
            await deployer.deploy(GasLimitBlockOracle, pmSystem.address, 1, 1e9, "0x02");
            await deployer.deploy(ETHValueBlockOracle, pmSystem.address, medianizerAddr, 1, 1e9, "0x03");
        });
    } else if (network === 'mainnet') {
        const medianizerAddr = '0x729D19f657BD0614b4985Cf1D82531c67569197B';
        deployer.deploy(PredictionMarketSystem).then(async (pmSystem) => {
            await deployer.deploy(DifficultyBlockOracle, pmSystem.address, 1, 1e9, "0x01");
            await deployer.deploy(GasLimitBlockOracle, pmSystem.address, 1, 1e9, "0x02");
            await deployer.deploy(ETHValueBlockOracle, pmSystem.address, medianizerAddr, 1, 1e9, "0x03");
        });
    }
}
