const { keccak256, toChecksumAddress } = web3.utils;
const rlp = require("rlp");
const writeToConfig = require("./utils/writeToConfig");

const PredictionMarketSystem = artifacts.require("PredictionMarketSystem");
const LMSRMarketMakerFactory = artifacts.require("LMSRMarketMakerFactory");
const WETH9 = artifacts.require("WETH9");
const ERC20Detailed = artifacts.require("ERC20Detailed");

//const initialNonce = 0x03;
const defaultAMMFunding = (1e19).toString();
const initialNonce = 0x01;

module.exports = async (deployer, network, accounts) => {
  if (!process.env.CONDITION_IDS) {
    throw new Error(
      "Rerun this Migration with 'export CONDITION_IDS=\"0xabc,0xdef,0xbeef\"' or run all migrations again with --reset"
    );
  }

  const [
    conditionOneId,
    conditionTwoId,
    conditionThreeId
  ] = process.env.CONDITION_IDS.split(",");
  if (network === "mainnet") {
    //   __  __    _    ___ _   _ _   _ _____ _____
    // |  \/  |  / \  |_ _| \ | | \ | | ____|_   _|
    // | |\/| | / _ \  | ||  \| |  \| |  _|   | |
    // | |  | |/ ___ \ | || |\  | |\  | |___  | |
    // |_|  |_/_/   \_\___|_| \_|_| \_|_____| |_|
    //
    // Mainnet Deploy below this point. Be careful 🙈
    //

    const DAI_TOKEN_ADDRESS = "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359";
    const pmSystemInstance = await PredictionMarketSystem.deployed();
    const collateralToken = await ERC20Detailed.at(DAI_TOKEN_ADDRESS);
    const LMSRMarketMakerFactoryInstance = await LMSRMarketMakerFactory.deployed();

    // Pre-Calculate the LMSRAMM instance address
    const checksummedLMSRAddress = toChecksumAddress(
      keccak256(
        rlp.encode([LMSRMarketMakerFactoryInstance.address, initialNonce])
      ).substr(26)
    );
    // Deposit the CollateralTokens necessary and approve() the pre-deployed LMSR instance
    await collateralToken.approve(
      checksummedLMSRAddress,
      process.env.AMMFUNDING || defaultAMMFunding,
      { from: accounts[0] }
    );

    // Deploy the pre-calculated LMSR instance
    const tx = await LMSRMarketMakerFactoryInstance.createLMSRMarketMaker(
      pmSystemInstance.address,
      collateralToken.address,
      [conditionOneId, conditionTwoId, conditionThreeId],
      0,
      process.env.AMMFUNDING || defaultAMMFunding,
      { from: accounts[0] }
    );
    const lmsrEvent = tx.receipt.logs.filter(
      log => log.event === "LMSRMarketMakerCreation"
    )[0];
    const lmsrAddress = lmsrEvent.args.lmsrMarketMaker;

    if (lmsrAddress !== checksummedLMSRAddress) {
      throw new Error("LMSR ADDRESS DOES NOT MATCH");
    }

    writeToConfig("mainnet", {
      lmsr: checksummedLMSRAddress
    });

    //
    // Mainnet Deploy above this point. Be careful 🙈
    //   __  __    _    ___ _   _ _   _ _____ _____
    // |  \/  |  / \  |_ _| \ | | \ | | ____|_   _|
    // | |\/| | / _ \  | ||  \| |  \| |  _|   | |
    // | |  | |/ ___ \ | || |\  | |\  | |___  | |
    // |_|  |_/_/   \_\___|_| \_|_| \_|_____| |_|
    //
  } else if (network === "rinkeby") {
    const collateralToken = await WETH9.deployed();
    const pmSystemInstance = await PredictionMarketSystem.deployed();
    const LMSRMarketMakerFactoryInstance = await LMSRMarketMakerFactory.deployed();

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
    const tx = await LMSRMarketMakerFactoryInstance.createLMSRMarketMaker(
      pmSystemInstance.address,
      collateralToken.address,
      [conditionOneId, conditionTwoId, conditionThreeId],
      0,
      process.env.AMMFUNDING || defaultAMMFunding,
      { from: accounts[0] }
    );
    const lmsrEvent = tx.receipt.logs.filter(
      log => log.event === "LMSRMarketMakerCreation"
    )[0];
    const lmsrAddress = lmsrEvent.args.lmsrMarketMaker;

    if (lmsrAddress !== checksummedLMSRAddress) {
      throw new Error("LMSR ADDRESS DOES NOT MATCH");
    }

    writeToConfig("rinkeby", {
      lmsr: checksummedLMSRAddress
    });
  } else if (network === "development" || network === "test") {
    const collateralToken = await WETH9.deployed();
    const pmSystemInstance = await PredictionMarketSystem.deployed();
    const LMSRMarketMakerFactoryInstance = await LMSRMarketMakerFactory.deployed();

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
    const tx = await LMSRMarketMakerFactoryInstance.createLMSRMarketMaker(
      pmSystemInstance.address,
      collateralToken.address,
      [conditionOneId, conditionTwoId, conditionThreeId],
      0,
      process.env.AMMFUNDING || defaultAMMFunding,
      { from: accounts[0] }
    );

    const lmsrEvent = tx.receipt.logs.filter(
      log => log.event === "LMSRMarketMakerCreation"
    )[0];
    const lmsrAddress = lmsrEvent.args.lmsrMarketMaker;

    if (lmsrAddress !== checksummedLMSRAddress) {
      throw new Error("LMSR ADDRESS DOES NOT MATCH");
    }

    writeToConfig("ganache", {
      lmsr: checksummedLMSRAddress
    });
  }
};
