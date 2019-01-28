const truffleAssert = require('truffle-assertions');
const assert = require('chai').assert;
const rlp = require('rlp');
const { assertRejects, getParamFromTxEvent } = require("./utils");
const { toHex, padLeft, keccak256, asciiToHex, toBN, fromWei, toChecksumAddress } = web3.utils;
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
    let conditionOneId, conditionTwoId;
    let checksummedLMSRAddress;
    let lmsrInstance;
    let baseCollectionId1, baseCollectionId2;
    let basePositionId1, basePositionId2;
    let collectionId1, collectionId2, collectionId3, collectionId4;
    let positionId1, positionId2, positionId3, positionId4;

    before(async () => {
        pmSystem = await PredictionMarketSystem.deployed();
        lmsrFactory = await LMSRMarketMakerFactory.deployed();
        collateralToken = await WETH9.deployed();
        
        diffOracleInstance = await DifficultyOracle.deployed();
        gasOracleInstance = await GasLimitOracle.deployed();
        
        // Condition IDs
        conditionOneId = keccak256(DifficultyOracle.address + [process.env.O1QUESTIONID || "0x0100000000000000000000000000000000000000000000000000000000000000", 2].map(v => padLeft(toHex(v), 64).slice(2)).join(""));
        conditionTwoId = keccak256(GasLimitOracle.address + [process.env.O2QUESTIONID || "0x0200000000000000000000000000000000000000000000000000000000000000", 2].map(v => padLeft(toHex(v), 64).slice(2)).join(""));
        
        // LMSR Address
        checksummedLMSRAddress = toChecksumAddress(keccak256(rlp.encode([lmsrFactory.address, 0x01])).substr(26));
        lmsrInstance = await LMSRMarketMaker.at(checksummedLMSRAddress);  

        // The pmSystem should have 4 positions equal to env.AMMFUNDING now
        baseCollectionId1 = keccak256(
            conditionTwoId + padLeft(toHex(0b01), 64).slice(2)
        );
        baseCollectionId2 = keccak256(
            conditionTwoId + padLeft(toHex(0b10), 64).slice(2)
        );

        basePositionId1 = keccak256(
            collateralToken.address + baseCollectionId1.slice(2)
        );
        basePositionId2 = keccak256(
            collateralToken.address + baseCollectionId2.slice(2)
        );

        collectionId1 = "0x" + toHex(toBN(baseCollectionId1).add(
            toBN(keccak256(conditionOneId + padLeft(toHex(0b10), 64).slice(2)))
        )).slice(-64);
        collectionId2 = "0x" + toHex(toBN(baseCollectionId1).add(
            toBN(keccak256(conditionOneId + padLeft(toHex(0b01), 64).slice(2)))
        )).slice(-64);
        collectionId3 = "0x" + toHex(toBN(baseCollectionId2).add(
            toBN(keccak256(conditionOneId + padLeft(toHex(0b10), 64).slice(2)))
        )).slice(-64);
        collectionId4 = "0x" + toHex(toBN(baseCollectionId2).add(
            toBN(keccak256(conditionOneId + padLeft(toHex(0b01), 64).slice(2)))
        )).slice(-64);

        positionId1 = keccak256(
            collateralToken.address + collectionId1.slice(2)
        );
        positionId2 = keccak256(
            collateralToken.address + collectionId2.slice(2)
        );
        positionId3 = keccak256(
            collateralToken.address + collectionId3.slice(2)
        );
        positionId4 = keccak256(
            collateralToken.address + collectionId4.slice(2)
        );
    });

    it("Should have conditions in the system with the listed ConditionIDs", async () => {
        // This reverts if the payoutNumerator would be invalid
        // So asserting 0 means that it has been created
        var numeratorLen = await pmSystem.payoutNumerators(conditionOneId, 0).then(r => r.toString());
        assert.equal(numeratorLen, 0);

        var numeratorLen2 = await pmSystem.payoutNumerators(conditionTwoId, 0).then(r => r.toString());
        assert.equal(numeratorLen2, 0);
    });

    it("Should have an LMSR deployed with the correct funding", async () => {
      assert.equal(await lmsrInstance.funding(), process.env.AMMFUNDING);
      assert.equal(await lmsrInstance.atomicOutcomeSlotCount(), 4);
    });

    it("The LMSR should have the correct amount of tokens at the specified positions", async () => {


        assert.equal(await pmSystem.balanceOf(lmsrInstance.address, positionId1), process.env.AMMFUNDING);    
        assert.equal(await pmSystem.balanceOf(lmsrInstance.address, positionId2), process.env.AMMFUNDING);    
        assert.equal(await pmSystem.balanceOf(lmsrInstance.address, positionId3), process.env.AMMFUNDING);    
        assert.equal(await pmSystem.balanceOf(lmsrInstance.address, positionId4), process.env.AMMFUNDING);    
    });

    it("Users should be able to buy a position", async () => {
        // Users should buy one of the AMMs positions.
        await collateralToken.deposit({ from: accounts[9], value: toBN(1e18) });
        await collateralToken.approve(lmsrInstance.address, toBN(1e18), { from: accounts[9] });
        await lmsrInstance.trade([1e9, 0, 1e9, 0], toBN(1e18), { from: accounts[9]});

        assert.equal(await pmSystem.balanceOf(accounts[9], positionId1), 0);
        assert.equal(await pmSystem.balanceOf(accounts[9], positionId2), 1e9);
        assert.equal(await pmSystem.balanceOf(accounts[9], positionId3), 0);
        assert.equal(await pmSystem.balanceOf(accounts[9], positionId4), 1e9);
    });

    it("Users should not be able to redeem a position before the oracle reports", async () => {
        await truffleAssert.fails(
            pmSystem.redeemPositions(collateralToken.address, baseCollectionId1, conditionOneId, [0b01, 0b10]),
            truffleAssert.ErrorType.REVERT,
            "result for condition not received yet"
        );
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
    });

    it("Users should be able to redeem their positions now, but not buy more", async () => {
        const beforeRedeemBalance = await collateralToken.balanceOf(accounts[9]).then(r => r.toString());
        // This only redeems the 2nd layer Atomic Outcome Tokens, which should now give us a certain balance at the root Condition
        await pmSystem.redeemPositions(collateralToken.address, baseCollectionId1, conditionOneId, [0b01, 0b10], {
            from: accounts[9]
        });
        await pmSystem.redeemPositions(collateralToken.address, baseCollectionId2, conditionOneId, [0b01, 0b10], {
            from: accounts[9]
        });
        assert.equal(await collateralToken.balanceOf(accounts[9]).then(r => r.toString()), beforeRedeemBalance);

        // const p1 = await pmSystem.balanceOf(accounts[9], basePositionId1).then(r => r.toString());
        // const p2 = await pmSystem.balanceOf(accounts[9], basePositionId2).then(r => r.toString());

        await pmSystem.redeemPositions(collateralToken.address, toHex(0), conditionTwoId, [0b01, 0b10], {
            from: accounts[9]
        });

        assert.notEqual(await collateralToken.balanceOf(accounts[9]).then(r => r.toString()), beforeRedeemBalance);
    });

    it("Users shouldn't be able to buy more positions after event resolution", async () => {
        // Users should buy one of the AMMs positions.
        await collateralToken.approve(lmsrInstance.address, toBN(1e18), { from: accounts[9] });
        await truffleAssert.fails(
            lmsrInstance.trade([0, 1e9, 0, 1e9], toBN(1e18), { from: accounts[9]}),
            truffleAssert.ErrorType.REVERT
        );
     });




});