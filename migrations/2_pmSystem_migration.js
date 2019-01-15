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
            const collateralToken = await deployer.deploy(WETH9);
            
            const difficultyOracleInstance = await deployer.deploy(DifficultyBlockOracle, pmSystemInstance.address, 1, 1e9, 200, "0x01");
            const gasLimitOracleInstance = await deployer.deploy(GasLimitBlockOracle, pmSystemInstance.address, 1, 1e9, 400, "0x02");
            
            // The LMSR account is accounts[3]. You must keep track of its nonce.
            await deployer.deploy(Fixed192x64Math);
            await deployer.link(Fixed192x64Math, LMSRMarketMakerFactory);
            const LMSRMarketMakerFactoryInstance = await deployer.deploy(LMSRMarketMakerFactory);

            let lmsrAccNonce = 0x01;
            console.log(typeof accounts[3], accounts[3]);
            console.log(typeof gasLimitOracleInstance.address, gasLimitOracleInstance.address)


            // const deployLMSR = (funding) => {
                const checksummedLMSRAddress = toChecksumAddress(keccak256(rlp.encode([LMSRMarketMakerFactoryInstance.address, lmsrAccNonce])).substr(26));
                
                const getTokens = await collateralToken.deposit({ from: accounts[3], value: funding});
                lmsrAccNonce++;
                const approveLMSR = await collateralToken.approve(checksummedLMSRAddress, funding, { from: accounts[3]});
                lmsrAccNonce++;
                const difficultyAMM = await deployer.deploy(LMSRMarketMaker, pmSystemInstance, collateralToken, conditionOneId, 0, 1000, accounts[3]);
                lmsrAccNonce++;
                console.log(difficultyAMM);
                
            // }
            // Calculate the address of the LMSR via nonce before it's deployed (in order to allow approve() call)

            const conditionOne = await pmSystemInstance.prepareCondition(difficultyOracleInstance.address, "0x01", 2);
            const conditionTwo = await pmSystemInstance.prepareCondition(gasLimitOracleInstance.address, "0x02", 2);
            
            const conditionOneId = keccak256(difficultyOracleInstance.address + ["0x0100000000000000000000000000000000000000000000000000000000000000", 2].map(v => padLeft(toHex(v), 64).slice(2)).join(""));
            const conditionTwoId = keccak256(gasLimitOracleInstance.address + ["0x0200000000000000000000000000000000000000000000000000000000000000", 2].map(v => padLeft(toHex(v), 64).slice(2)).join(""));
            console.log(getTokens, '\n', getTokens2);

 
            // console.log(conditionOne);

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
