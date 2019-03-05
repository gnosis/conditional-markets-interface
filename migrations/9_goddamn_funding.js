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
const ERC20Detailed = artifacts.require("ERC20Detailed");

//const initialNonce = 0x03;
const defaultAMMFunding = (1e19).toString();

module.exports = async (deployer, network, accounts) => {
  
  if (network === "mainnet") {
    //   __  __    _    ___ _   _ _   _ _____ _____ 
    // |  \/  |  / \  |_ _| \ | | \ | | ____|_   _|
    // | |\/| | / _ \  | ||  \| |  \| |  _|   | |  
    // | |  | |/ ___ \ | || |\  | |\  | |___  | |  
    // |_|  |_/_/   \_\___|_| \_|_| \_|_____| |_|    
    //
    // Mainnet Deploy below this point. Be careful 🙈
    //

    const DAI_TOKEN_ADDRESS = "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359"
    const pmSystemInstance = await PredictionMarketSystem.deployed()
    const collateralToken = await ERC20Detailed.at(DAI_TOKEN_ADDRESS)
    const LMSRMarketMakerFactoryInstance = await LMSRMarketMakerFactory.deployed()

    // Pre-Calculate the LMSRAMM instance address
    console.log("calculating checksummedAddress")
    const initialNonce = 0x01 // await web3.eth.getTransactionCount(LMSRMarketMakerFactoryInstance.address)
    const checksummedLMSRAddress = toChecksumAddress(
      keccak256(
        rlp.encode([LMSRMarketMakerFactoryInstance.address, initialNonce])
      ).substr(26)
    );
    console.log(checksummedLMSRAddress)
    // Deposit the CollateralTokens necessary and approve() the pre-deployed LMSR instance
    console.log("approving dai")
    await collateralToken.approve(
      checksummedLMSRAddress,
      process.env.AMMFUNDING || defaultAMMFunding,
      { from: accounts[0] }
    );

    const [conditionOneId, conditionTwoId, conditionThreeId] = ["0xeb7b2eb5eee50520030df71acfe6acc3a99122a156e7f000f06e91ae3a432fdf", "0x2c4c120cf6ba3e734a03df687db37c09e3f5820adb28afd344b10ada7b04b4bc", "0x865a48fcff648984d8e1f75e67786bb39fbd03dac9d484fde8decb817aae5ab9"]
    // Deploy the pre-calculated LMSR instance
    console.log("creating market maker")
    const tx = await LMSRMarketMakerFactoryInstance.createLMSRMarketMaker(
      pmSystemInstance.address,
      collateralToken.address,
      [conditionOneId, conditionTwoId, conditionThreeId],
      0,
      process.env.AMMFUNDING || defaultAMMFunding,
      { from: accounts[0] }
    );
    console.log(tx)

    throw new Error("Please don't save my deployment")

    //
    // Mainnet Deploy above this point. Be careful 🙈
    //   __  __    _    ___ _   _ _   _ _____ _____ 
    // |  \/  |  / \  |_ _| \ | | \ | | ____|_   _|
    // | |\/| | / _ \  | ||  \| |  \| |  _|   | |  
    // | |  | |/ ___ \ | || |\  | |\  | |___  | |  
    // |_|  |_/_/   \_\___|_| \_|_| \_|_____| |_|    
    //
  }
};
