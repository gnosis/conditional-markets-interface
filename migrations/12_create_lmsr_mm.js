const Decimal = require("decimal.js-light");
Decimal.config({ precision: 30 });

const deployConfig = require("./utils/deploy-config");
const writeToConfig = require("./utils/writeToConfig");

module.exports = function(deployer, network, accounts) {
  deployer.then(async () => {
    const conditionIds = [
      ["DutchXTokenPriceOracle", deployConfig.daiPriceQuestionID],
      ["TokenSupplyOracle", deployConfig.daiSupplyQuestionID],
      ["DaiStabilityFeeOracle", deployConfig.daiStabilityFeeQuestionID]
    ].map(([contractName, questionId]) =>
      web3.utils.soliditySha3(
        { t: "address", v: artifacts.require(contractName).address },
        { t: "bytes32", v: questionId },
        { t: "uint", v: 2 }
      )
    );

    const DaiStandin = artifacts.require("DaiStandin");
    const collateralToken = await DaiStandin.deployed();

    const lmsrMarketMakerFactory = await artifacts
      .require("LMSRMarketMakerFactory")
      .deployed();

    const { ammFunding } = deployConfig;
    const deployingAccount = DaiStandin.defaults()["from"];
    const collateralTokenOwner = await collateralToken.owner();
    if (collateralTokenOwner !== `0x${"00".repeat(20)}`) {
      // if the Dai standin contract has no owner, then it is the real contract
      // but if it has an owner, then it was deployed earlier and can be minted
      for (const account of accounts) {
        await collateralToken.mint(account, ammFunding, {
          from: collateralTokenOwner
        });
      }
      await collateralToken.mint(deployingAccount, ammFunding, {
        from: collateralTokenOwner
      });
    }

    await collateralToken.approve(lmsrMarketMakerFactory.address, ammFunding);

    const lmsrAddress = (await lmsrMarketMakerFactory.createLMSRMarketMaker(
      artifacts.require("PredictionMarketSystem").address,
      collateralToken.address,
      conditionIds,
      0,
      ammFunding
    )).logs.find(({ event }) => event === "LMSRMarketMakerCreation").args
      .lmsrMarketMaker;

    const formattedDaiPriceTargetValue = `$${web3.utils.fromWei(
      deployConfig.daiPriceTargetValue
    )}`;

    const formattedDaiSupplyTargetValue = `${web3.utils.fromWei(
      deployConfig.daiSupplyTargetValue,
      "mether"
    )} million DAI`;

    const formattedDaiStabilityFeeTargetValue = `${new Decimal(
      web3.utils.fromWei(deployConfig.daiStabilityFeeTargetValue, "gether")
    )
      .pow(60 * 60 * 24 * 365)
      .sub(1)
      .mul(100)
      .toSignificantDigits(4)}%`;

    writeToConfig({
      networkId: await web3.eth.net.getId(),
      lmsrAddress,
      markets: [
        {
          title: `Will the DAI price exceed ${formattedDaiPriceTargetValue} according to the DutchX last auction closing price and Maker ETH price feed?`,
          resolutionDate: new Date(
            deployConfig.daiPriceResolutionTime * 1000
          ).toISOString(),
          outcomes: [
            {
              title: "Yes",
              short: "Yes",
              when: `1 DAI > ${formattedDaiPriceTargetValue}`
            },
            {
              title: "No",
              short: "No",
              when: `1 DAI ≤ ${formattedDaiPriceTargetValue}`
            }
          ]
        },
        {
          title: `Will the DAI supply exceed ${formattedDaiSupplyTargetValue}?`,
          resolutionDate: new Date(
            deployConfig.daiSupplyResolutionTime * 1000
          ).toISOString(),
          outcomes: [
            {
              title: "Yes",
              short: "Yes",
              when: `DAI supply > ${formattedDaiSupplyTargetValue}`
            },
            {
              title: "No",
              short: "No",
              when: `DAI supply ≤ ${formattedDaiSupplyTargetValue}`
            }
          ]
        },
        {
          title: `Will the DAI stability fee exceed ${formattedDaiStabilityFeeTargetValue}?`,
          resolutionDate: new Date(
            deployConfig.daiStabilityFeeResolutionTime * 1000
          ).toISOString(),
          outcomes: [
            {
              title: "Yes",
              short: "Yes",
              when: `DAI stability fee > ${formattedDaiStabilityFeeTargetValue}`
            },
            {
              title: "No",
              short: "No",
              when: `DAI stability fee ≤ ${formattedDaiStabilityFeeTargetValue}`
            }
          ]
        }
      ]
    });
  });
};
