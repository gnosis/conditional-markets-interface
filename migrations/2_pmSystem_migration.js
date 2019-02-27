const { toHex, padLeft, keccak256, toChecksumAddress } = web3.utils;
const rlp = require("rlp");

const PredictionMarketSystem = artifacts.require("PredictionMarketSystem");
const DifficultyOracle = artifacts.require("DifficultyOracle");
const ETHValueOracle = artifacts.require("ETHValueOracle");
const GasLimitOracle = artifacts.require("GasLimitOracle");
const LMSRMarketMaker = artifacts.require("LMSRMarketMaker");
const LMSRMarketMakerFactory = artifacts.require("LMSRMarketMakerFactory");
const Fixed192x64Math = artifacts.require("Fixed192x64Math");
const WETH9 = artifacts.require("WETH9");

const initialNonce = 0x01;
const defaultAMMFunding = (1e19).toString();

module.exports = (deployer, network, accounts) => {
  if (network === "development" || network === "test") {
    deployer.deploy(PredictionMarketSystem).then(async pmSystemInstance => {
      // Deploy the base contracts
      await deployer.deploy(Fixed192x64Math);
      await deployer.link(Fixed192x64Math, LMSRMarketMakerFactory);
      await deployer.link(Fixed192x64Math, LMSRMarketMaker);
      const collateralToken = await deployer.deploy(WETH9);
      const LMSRMarketMakerFactoryInstance = await deployer.deploy(
        LMSRMarketMakerFactory
      );
      // Deploy the Oracle contracts
      const difficultyOracleInstance = await deployer.deploy(
        DifficultyOracle,
        pmSystemInstance.address,
        process.env.O1SSTARTBLOCK || 1,
        process.env.O1ENDBLOCK || 1e9,
        process.env.O1TARGET || 10,
        process.env.O1QUESTIONID || "0x01"
      );
      const gasLimitOracleInstance = await deployer.deploy(
        GasLimitOracle,
        pmSystemInstance.address,
        process.env.O2STARTBLOCK || 1,
        process.env.O2ENDBLOCK || 1e9,
        process.env.O2TARGET || 10,
        process.env.O2QUESTIONID || "0x02"
      );
      const anotherGasLimitOracleInstance = await deployer.deploy(
        GasLimitOracle,
        pmSystemInstance.address,
        process.env.O2STARTBLOCK || 1,
        process.env.O2ENDBLOCK || 1e9,
        process.env.O2TARGET || 10,
        process.env.O2QUESTIONID || "0x03"
      );
      // Prepare and identify the conditions in the pmSystem
      await pmSystemInstance.prepareCondition(
        difficultyOracleInstance.address,
        process.env.O1QUESTIONID || "0x01",
        2
      );
      await pmSystemInstance.prepareCondition(
        gasLimitOracleInstance.address,
        process.env.O2QUESTIONID || "0x02",
        2
      );
      await pmSystemInstance.prepareCondition(
        anotherGasLimitOracleInstance.address,
        process.env.O2QUESTIONID || "0x03",
        2
      );
      const conditionOneId = keccak256(
        difficultyOracleInstance.address +
          [
            process.env.O1QUESTIONID ||
              "0x0100000000000000000000000000000000000000000000000000000000000000",
            2
          ]
            .map(v => padLeft(toHex(v), 64).slice(2))
            .join("")
      );
      const conditionTwoId = keccak256(
        gasLimitOracleInstance.address +
          [
            process.env.O2QUESTIONID ||
              "0x0200000000000000000000000000000000000000000000000000000000000000",
            2
          ]
            .map(v => padLeft(toHex(v), 64).slice(2))
            .join("")
      );
      const conditionThreeId = keccak256(
        anotherGasLimitOracleInstance.address +
          [
            process.env.O3QUESTIONID ||
              "0x0300000000000000000000000000000000000000000000000000000000000000",
            2
          ]
            .map(v => padLeft(toHex(v), 64).slice(2))
            .join("")
      );
      // Pre-Calculate the LMSRAMM instance address
      const checksummedLMSRAddress = toChecksumAddress(
        keccak256(
          rlp.encode([LMSRMarketMakerFactoryInstance.address, initialNonce])
        ).substr(26)
      );
      // Deposit the CollateralTokens necessary and approve() the pre-deployed LMSR instance
      await collateralToken.deposit({
        from: accounts[0],
        value: process.env.AMMFUNDING || defaultAMMFunding
      });
      await collateralToken.approve(
        checksummedLMSRAddress,
        process.env.AMMFUNDING || defaultAMMFunding,
        { from: accounts[0] }
      );
      // Deploy the pre-calculated LMSR instance
      await LMSRMarketMakerFactoryInstance.createLMSRMarketMaker(
        pmSystemInstance.address,
        collateralToken.address,
        [conditionOneId, conditionTwoId, conditionThreeId],
        1,
        process.env.AMMFUNDING || defaultAMMFunding,
        { from: accounts[0] }
      );
    });
  } else if (network === "rinkeby" || network === "mainnet") {
    let medianizerAddr;
    if (network === "rinkeby") {
      medianizerAddr = "0xbfFf80B73F081Cc159534d922712551C5Ed8B3D3";
    } else if (network === "mainnet") {
      medianizerAddr = "0x729D19f657BD0614b4985Cf1D82531c67569197B";
    }

    deployer.deploy(PredictionMarketSystem).then(async pmSystemInstance => {
      // Deploy the base contracts
      await deployer.deploy(Fixed192x64Math);
      await deployer.link(Fixed192x64Math, LMSRMarketMakerFactory);
      await deployer.link(Fixed192x64Math, LMSRMarketMaker);
      const collateralToken = await deployer.deploy(WETH9);
      const LMSRMarketMakerFactoryInstance = await deployer.deploy(
        LMSRMarketMakerFactory
      );
      // Deploy the Oracle contracts
      const difficultyOracleInstance = await deployer.deploy(
        DifficultyOracle,
        pmSystemInstance.address,
        process.env.O1SSTARTBLOCK || 1,
        process.env.O1ENDBLOCK || 1e9,
        process.env.O1TARGET || 10,
        process.env.O1QUESTIONID || "0x01"
      );
      const gasLimitOracleInstance = await deployer.deploy(
        GasLimitOracle,
        pmSystemInstance.address,
        process.env.O2STARTBLOCK || 1,
        process.env.O2ENDBLOCK || 1e9,
        process.env.O2TARGET || 10,
        process.env.O2QUESTIONID || "0x02"
      );
      const ethValueOracleInstance = await deployer.deploy(
        ETHValueOracle,
        pmSystemInstance.address,
        medianizerAddr,
        process.env.O3STARTBLOCK || 1,
        process.env.O3ENDBLOCK || 1e9,
        process.env.O3TARGET || 10,
        process.env.O3QUESTIONID || "0x03"
      );
      // Prepare and identify the conditions in the pmSystem
      await pmSystemInstance.prepareCondition(
        difficultyOracleInstance.address,
        process.env.O1QUESTIONID || "0x01",
        2
      );
      await pmSystemInstance.prepareCondition(
        gasLimitOracleInstance.address,
        process.env.O2QUESTIONID || "0x02",
        2
      );
      await pmSystemInstance.prepareCondition(
        ethValueOracleInstance.address,
        process.env.O3QUESTIONID || "0x03",
        2
      );

      const conditionOneId = keccak256(
        difficultyOracleInstance.address +
          [
            process.env.O1QUESTIONID ||
              "0x0100000000000000000000000000000000000000000000000000000000000000",
            2
          ]
            .map(v => padLeft(toHex(v), 64).slice(2))
            .join("")
      );
      const conditionTwoId = keccak256(
        gasLimitOracleInstance.address +
          [
            process.env.O2QUESTIONID ||
              "0x0200000000000000000000000000000000000000000000000000000000000000",
            2
          ]
            .map(v => padLeft(toHex(v), 64).slice(2))
            .join("")
      );
      const conditionThreeId = keccak256(
        ethValueOracleInstance.address +
          [
            process.env.O3QUESTIONID ||
              "0x0300000000000000000000000000000000000000000000000000000000000000",
            2
          ]
            .map(v => padLeft(toHex(v), 64).slice(2))
            .join("")
      );

      console.log({
        difficultyMarket: conditionOneId,
        gasLimitMarket: conditionTwoId,
        ethValueMarket: conditionThreeId
      });

      // Pre-Calculate the LMSRAMM instance address
      const checksummedLMSRAddress = toChecksumAddress(
        keccak256(
          rlp.encode([LMSRMarketMakerFactoryInstance.address, initialNonce])
        ).substr(26)
      );
      // Deposit the CollateralTokens necessary and approve() the pre-deployed LMSR instance
      await collateralToken.deposit({
        from: accounts[0],
        value: process.env.AMMFUNDING || defaultAMMFunding
      });
      await collateralToken.approve(
        checksummedLMSRAddress,
        process.env.AMMFUNDING || defaultAMMFunding,
        { from: accounts[0] }
      );
      // Deploy the pre-calculated LMSR instance
      await LMSRMarketMakerFactoryInstance.createLMSRMarketMaker(
        pmSystemInstance.address,
        collateralToken.address,
        [conditionOneId, conditionTwoId, conditionThreeId],
        1,
        process.env.AMMFUNDING || defaultAMMFunding,
        { from: accounts[0] }
      );
    });
  }
};
