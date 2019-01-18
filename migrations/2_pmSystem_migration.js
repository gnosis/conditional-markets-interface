const { toHex, padLeft, keccak256, asciiToHex, toBN, fromWei, toChecksumAddress } = web3.utils;
const rlp = require('rlp');

const PredictionMarketSystem = artifacts.require('PredictionMarketSystem');
const DifficultyBlockOracle = artifacts.require('DifficultyBlockOracle');
const ETHValueBlockOracle = artifacts.require('ETHValueBlockOracle');
const GasLimitBlockOracle = artifacts.require('GasLimitBlockOracle');
const LMSRMarketMaker = artifacts.require('LMSRMarketMaker');
const LMSRMarketMakerFactory = artifacts.require('LMSRMarketMakerFactory');
const Fixed192x64Math = artifacts.require('Fixed192x64Math');
const WETH9 = artifacts.require('WETH9');

module.exports = (deployer, network, accounts) => {
    if (network === 'development') {
        deployer.deploy(PredictionMarketSystem).then(async (pmSystemInstance) => {
            // Deploy the base contracts
            await deployer.deploy(Fixed192x64Math);
            await deployer.link(Fixed192x64Math, LMSRMarketMakerFactory);
            await deployer.link(Fixed192x64Math, LMSRMarketMaker);
            const collateralToken = await deployer.deploy(WETH9);
            const LMSRMarketMakerFactoryInstance = await deployer.deploy(LMSRMarketMakerFactory);
            // Deploy the Oracle contracts
            const difficultyOracleInstance = await deployer.deploy(DifficultyBlockOracle, pmSystemInstance.address, 1, 1e9, 200, "0x01");
            const gasLimitOracleInstance = await deployer.deploy(GasLimitBlockOracle, pmSystemInstance.address, 1, 1e9, 400, "0x02");
            // Prepare and identify the conditions in the pmSystem
            await pmSystemInstance.prepareCondition(difficultyOracleInstance.address, "0x01", 2);
            await pmSystemInstance.prepareCondition(gasLimitOracleInstance.address, "0x02", 2);
            const conditionOneId = keccak256(difficultyOracleInstance.address + ["0x0100000000000000000000000000000000000000000000000000000000000000", 2].map(v => padLeft(toHex(v), 64).slice(2)).join(""));
            const conditionTwoId = keccak256(gasLimitOracleInstance.address + ["0x0200000000000000000000000000000000000000000000000000000000000000", 2].map(v => padLeft(toHex(v), 64).slice(2)).join(""));

            console.log({ conditionOneId, conditionTwoId })
            // Start the Nonce for LMSRFactory and Pre-Calculate the LMSRAMM instance address
            let factoryNonce = 0x01;
            const checksummedLMSRAddress = toChecksumAddress(keccak256(rlp.encode([LMSRMarketMakerFactoryInstance.address, factoryNonce])).substr(26));
            // Deposit the CollateralTokens necessary and approve() the pre-deployed LMSR instance
            await collateralToken.deposit({ from: accounts[3], value: 1e12});
            await collateralToken.approve(checksummedLMSRAddress, 1e12, { from: accounts[3]});
            // Deploy the pre-calculated LMSR instance 
            await LMSRMarketMakerFactoryInstance.createLMSRMarketMaker(pmSystemInstance.address, collateralToken.address, [conditionOneId, conditionTwoId], 1, 1e9, { from: accounts[3] });
            factoryNonce++;
        });
    } else if (network === 'rinkeby') {
        const medianizerAddr = '0xbfFf80B73F081Cc159534d922712551C5Ed8B3D3';
        deployer.deploy(PredictionMarketSystem).then(async (pmSystemInstance) => {
            // Deploy the base contracts
            await deployer.deploy(Fixed192x64Math);
            await deployer.link(Fixed192x64Math, LMSRMarketMakerFactory);
            await deployer.link(Fixed192x64Math, LMSRMarketMaker);
            const collateralToken = await deployer.deploy(WETH9);
            const LMSRMarketMakerFactoryInstance = await deployer.deploy(LMSRMarketMakerFactory);
            // Deploy the Oracle contracts
            const difficultyOracleInstance = await deployer.deploy(DifficultyBlockOracle, pmSystemInstance.address, 1, 1e9, 200, "0x01");
            const gasLimitOracleInstance = await deployer.deploy(GasLimitBlockOracle, pmSystemInstance.address, 1, 1e9, 400, "0x02");
            const ethValueOracleInstance = await deployer.deploy(ETHValueBlockOracle, pmSystemInstance.address, medianizerAddr, 1, 1e9, "0x03");
            // Prepare and identify the conditions in the pmSystem
            await pmSystemInstance.prepareCondition(difficultyOracleInstance.address, "0x01", 2);
            await pmSystemInstance.prepareCondition(gasLimitOracleInstance.address, "0x02", 2);
            await pmSystemInstance.prepareCondition(ethValueOracleInstance.address, "0x03", 2);
            const conditionOneId = keccak256(difficultyOracleInstance.address + ["0x0100000000000000000000000000000000000000000000000000000000000000", 2].map(v => padLeft(toHex(v), 64).slice(2)).join(""));
            const conditionTwoId = keccak256(gasLimitOracleInstance.address + ["0x0200000000000000000000000000000000000000000000000000000000000000", 2].map(v => padLeft(toHex(v), 64).slice(2)).join(""));
            const conditionThreeId = keccak256(ethValueOracleInstance.address + ["0x0300000000000000000000000000000000000000000000000000000000000000", 2].map(v => padLeft(toHex(v), 64).slice(2)).join(""));

            console.log({ conditionOneId, conditionTwoId, conditionThreeId })
            // Start the Nonce for LMSRFactory and Pre-Calculate the LMSRAMM instance address
            let factoryNonce = 0x01;
            const checksummedLMSRAddress = toChecksumAddress(keccak256(rlp.encode([LMSRMarketMakerFactoryInstance.address, factoryNonce])).substr(26));
            // Deposit the CollateralTokens necessary and approve() the pre-deployed LMSR instance
            await collateralToken.deposit({ from: accounts[3], value: 1e12});
            await collateralToken.approve(checksummedLMSRAddress, 1e12, { from: accounts[3]});
            // Deploy the pre-calculated LMSR instance 
            await LMSRMarketMakerFactoryInstance.createLMSRMarketMaker(pmSystemInstance.address, collateralToken.address, [conditionOneId, conditionTwoId, conditionThreeId], 1, 1e9, { from: accounts[3] });
            factoryNonce++;            
        });
    } else if (network === 'mainnet') {
        const medianizerAddr = '0x729D19f657BD0614b4985Cf1D82531c67569197B';
        deployer.deploy(PredictionMarketSystem).then(async (pmSystemInstance) => {
            // Deploy the base contracts
            await deployer.deploy(Fixed192x64Math);
            await deployer.link(Fixed192x64Math, LMSRMarketMakerFactory);
            await deployer.link(Fixed192x64Math, LMSRMarketMaker);
            const collateralToken = await deployer.deploy(WETH9);
            const LMSRMarketMakerFactoryInstance = await deployer.deploy(LMSRMarketMakerFactory);
            // Deploy the Oracle contracts
            const difficultyOracleInstance = await deployer.deploy(DifficultyBlockOracle, pmSystemInstance.address, 1, 1e9, 200, "0x01");
            const gasLimitOracleInstance = await deployer.deploy(GasLimitBlockOracle, pmSystemInstance.address, 1, 1e9, 400, "0x02");
            const ethValueOracleInstance = await deployer.deploy(ETHValueBlockOracle, pmSystemInstance.address, medianizerAddr, 1, 1e9, "0x03");
            // Prepare and identify the conditions in the pmSystem
            await pmSystemInstance.prepareCondition(difficultyOracleInstance.address, "0x01", 2);
            await pmSystemInstance.prepareCondition(gasLimitOracleInstance.address, "0x02", 2);
            await pmSystemInstance.prepareCondition(ethValueOracleInstance.address, "0x03", 2);
            const conditionOneId = keccak256(difficultyOracleInstance.address + ["0x0100000000000000000000000000000000000000000000000000000000000000", 2].map(v => padLeft(toHex(v), 64).slice(2)).join(""));
            const conditionTwoId = keccak256(gasLimitOracleInstance.address + ["0x0200000000000000000000000000000000000000000000000000000000000000", 2].map(v => padLeft(toHex(v), 64).slice(2)).join(""));
            const conditionThreeId = keccak256(ethValueOracleInstance.address + ["0x0300000000000000000000000000000000000000000000000000000000000000", 2].map(v => padLeft(toHex(v), 64).slice(2)).join(""));
            // Start the Nonce for LMSRFactory and Pre-Calculate the LMSRAMM instance address
            let factoryNonce = 0x01;
            const checksummedLMSRAddress = toChecksumAddress(keccak256(rlp.encode([LMSRMarketMakerFactoryInstance.address, factoryNonce])).substr(26));
            // Deposit the CollateralTokens necessary and approve() the pre-deployed LMSR instance
            await collateralToken.deposit({ from: accounts[3], value: 1e12});
            await collateralToken.approve(checksummedLMSRAddress, 1e12, { from: accounts[3]});
            // Deploy the pre-calculated LMSR instance 
            await LMSRMarketMakerFactoryInstance.createLMSRMarketMaker(pmSystemInstance.address, collateralToken.address, [conditionOneId, conditionTwoId, conditionThreeId], 1, 1e9, { from: accounts[3] });
            factoryNonce++;   
        });
    }
}
