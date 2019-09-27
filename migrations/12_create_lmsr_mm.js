const Decimal = require("decimal.js-light");
Decimal.config({ precision: 30 });

const deployConfig = require("./utils/deploy-config")(artifacts);
const writeToConfig = require("./utils/writeToConfig");

module.exports = function(deployer) {
  deployer.then(async () => {
    const markets = require("../markets.config");
    const conditionIds = markets.map(({ questionId }) =>
      web3.utils.soliditySha3(
        { t: "address", v: deployConfig.oracle },
        { t: "bytes32", v: questionId },
        { t: "uint", v: 2 }
      )
    );

    const WETH9 = artifacts.require("WETH9");
    const collateralToken = await WETH9.deployed();

    const lmsrMarketMakerFactory = await artifacts
      .require("LMSRMarketMakerFactory")
      .deployed();

    const { ammFunding } = deployConfig;

    await collateralToken.deposit({ value: ammFunding });

    await collateralToken.approve(lmsrMarketMakerFactory.address, ammFunding);

    const lmsrFactoryTx = await lmsrMarketMakerFactory.createLMSRMarketMaker(
      artifacts.require("PredictionMarketSystem").address,
      collateralToken.address,
      conditionIds,
      0,
      ammFunding
    );

    const creationLogEntry = lmsrFactoryTx.logs.find(
      ({ event }) => event === "LMSRMarketMakerCreation"
    );

    if (!creationLogEntry) {
      // eslint-disable-next-line
      console.error(JSON.stringify(lmsrFactoryTx, null, 2));
      throw new Error(
        "No LMSRMarketMakerCreation Event fired. Please check the TX above.\nPossible causes for failure:\n- ABIs outdated. Delete the build/ folder\n- Transaction failure\n- Unfunded LMSR"
      );
    }

    const lmsrAddress = creationLogEntry.args.lmsrMarketMaker;

    writeToConfig({
      network: process.env.NETWORK || "local",
      networkId: await web3.eth.net.getId(),
      lmsrAddress,
      markets
    });
  });
};
