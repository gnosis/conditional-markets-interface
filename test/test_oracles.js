const truffleAssert = require('truffle-assertions');
const assert = require('chai').assert;
const { toHex, padLeft, keccak256, asciiToHex, toBN, fromWei } = web3.utils;
const { getBlockNumber } = web3.eth;

const PredictionMarketSystem = artifacts.require('PredictionMarketSystem');
const DifficultyOracle = artifacts.require('DifficultyOracle');
const ETHValueOracle = artifacts.require('ETHValueOracle');
const GasLimitOracle = artifacts.require('GasLimitOracle');
const LMSRMarketMaker = artifacts.require('LMSRMarketMaker');
const LMSRMarketMakerFactory = artifacts.require('LMSRMarketMakerFactory');
const WETH9 = artifacts.require('WETH9');

contract("Oracles", function(accounts) {
    let pmSystem;
    let diffOracleInstance;
    let gasOracleInstance;
    let collateralToken;
    let LMSRMarketMaker;
    let conditionOneId, conditionTwoId;


    before(async () => {
        pmSystem = await PredictionMarketSystem.deployed();
        lmsrFactory = await LMSRMarketMakerFactory.deployed();
        collateralToken = await WETH9.deployed();
        
        diffOracleInstance = await DifficultyOracle.deployed();
        gasOracleInstance = await GasLimitOracle.deployed();

        // Condition IDs
        conditionOneId = keccak256(DifficultyOracle.address + [process.env.O1QUESTIONID || "0x0100000000000000000000000000000000000000000000000000000000000000", 2].map(v => padLeft(toHex(v), 64).slice(2)).join(""));
        conditionTwoId = keccak256(GasLimitOracle.address + [process.env.O2QUESTIONID || "0x0200000000000000000000000000000000000000000000000000000000000000", 2].map(v => padLeft(toHex(v), 64).slice(2)).join(""));
    });

    it("Oracles should be able to send results", async () => {
        const resolveDiff = await diffOracleInstance.resolveDifficulty();
        const resolveGas = await gasOracleInstance.resolveGasLimit();

        truffleAssert.eventEmitted(resolveDiff, 'DiffResolutionSuccessful')
        truffleAssert.eventEmitted(resolveGas, 'resolutionSuccessful', (event) => {
            return eval.param1 == process.env.O2STARTGAS;
        }, 'The sucessful gas resolution should be emitted with the correct parameters');

        truffleAssert.eventNotEmitted(resolveDiff, 'resolutionFailed', null, 'Event resolution shouldn\'t fail');
        truffleAssert.eventNotEmitted(resolveDiff, 'resolutionFailed', null, 'Event resolution shouldn\'t fail');

        assert.notEqual(await pmSystem.payoutDenominator(conditionOneId), 0);
        assert.notEqual(await pmSystem.payoutDenominator(conditionTwoId), 0);
    })
});