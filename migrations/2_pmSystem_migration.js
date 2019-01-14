const PredictionMarketSystem = artifacts.require('PredictionMarketSystem');
const DifficultyBlockOracle = artifacts.require('DifficultyBlockOracle');
const ETHValueBlockOracle = artifacts.require('ETHValueBlockOracle');
const GasLimitBlockOracle = artifacts.require('GasLimitBlockOracle');
const LMSRMarketMaker = artifacts.require('LMSRMarketMaker');
const LMSRMarketMakerFactory = artifacts.require('LMSRMarketMakerFactory');
const WETH9 = artifacts.require('WETH9');

module.exports = (deployer, network, accounts) => {
    if (network === 'development') {

        deployer.deploy(PredictionMarketSystem).then(async (pmSystemInstance) => {
            // const difficultyOracleInstance = await deployer.deploy(DifficultyBlockOracle, pmSystemInstance.address, 1, 1e9, "0x01");
            // const gasLimitOracleInstance = await deployer.deploy(GasLimitBlockOracle, pmSystemInstance.address, 1, 1e9, "0x02");

            // await pmSystemInstance.prepareCondition(difficultyOracleInstance.address, "0x01", 2)
            // console.log(diffOracleInstance);

            // deployer.deploy(ETHValueBlockOracle, pmSystem.address, 1, 1e9, "0x01");
            // await deployer.deploy(LMSRMarketMakerFactory);
        });
    } else if (network === 'rinkeby') {
        const medianizerAddr = '0xbfFf80B73F081Cc159534d922712551C5Ed8B3D3';
        deployer.deploy(PredictionMarketSystem).then(async (pmSystemInstance) => {
            await deployer.deploy(LMSRMarketMakerFactory);
            await deployer.deploy(DifficultyBlockOracle, pmSystemInstance.address, 1, 1e9, "0x01");
            await deployer.deploy(GasLimitBlockOracle, pmSystemInstance.address, 1, 1e9, "0x02");
            await deployer.deploy(ETHValueBlockOracle, pmSystemInstance.address, medianizerAddr, 1, 1e9, "0x03");
        });
    } else if (network === 'mainnet') {
        const medianizerAddr = '0x729D19f657BD0614b4985Cf1D82531c67569197B';
        deployer.deploy(PredictionMarketSystem).then(async (pmSystemInstance) => {
            await deployer.deploy(LMSRMarketMakerFactory);
            await deployer.deploy(DifficultyBlockOracle, pmSystemInstance.address, 1, 1e9, "0x01");
            await deployer.deploy(GasLimitBlockOracle, pmSystemInstance.address, 1, 1e9, "0x02");
            await deployer.deploy(ETHValueBlockOracle, pmSystemInstance.address, medianizerAddr, 1, 1e9, "0x03");
        });
    }
}
