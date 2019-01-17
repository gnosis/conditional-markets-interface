const { toHex, padLeft, keccak256, asciiToHex, toBN, fromWei } = web3.utils;

const PredictionMarketSystem = artifacts.require('PredictionMarketSystem');
const DifficultyBlockOracle = artifacts.require('DifficultyBlockOracle');
const ETHValueBlockOracle = artifacts.require('ETHValueBlockOracle');
const GasLimitBlockOracle = artifacts.require('GasLimitBlockOracle');
const LMSRMarketMaker = artifacts.require('LMSRMarketMaker');
const LMSRMarketMakerFactory = artifacts.require('LMSRMarketMakerFactory');
const WETH9 = artifacts.require('WETH9');

contract("Oracles", function(accounts) {
    let pmSystem;
    let difficultyBlockOracle;
    let gasLimitBlockOracle;
    let collateralToken;
    let LMSRMarketMaker;

    before(async () => {
        pmSystem = await PredictionMarketSystem.deployed();
        difficultyBlockOracle = await DifficultyBlockOracle.deployed();
        gasLimitBlockOracle = await GasLimitBlockOracle.deployed();
        // collateralToken = await WETH9.deployed();
    });

    it("Should work", async () => {
        console.log(difficultyBlockOracle.address);
        const conditionOne = await pmSystem.prepareCondition(difficultyBlockOracle.address, "0x01", 2)
        // console.log(conditionOne);
    })
});