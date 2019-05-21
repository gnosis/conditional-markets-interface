const writeToConfig = require("./utils/writeToConfig");

const defaultAMMFunding = web3.utils.toBN(1e19);

module.exports = function(deployer, network, accounts) {
  deployer.then(async () => {
    const conditionIds = [
      ["DifficultyOracle", process.env.O1QUESTIONID || "0x01"],
      ["GasLimitOracle", process.env.O2QUESTIONID || "0x02"],
      ["ETHValueOracle", process.env.O3QUESTIONID || "0x03"]
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

    const ammFunding = process.env.AMMFUNDING || defaultAMMFunding;
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

    writeToConfig({
      networkId: await web3.eth.net.getId(),
      lmsrAddress
    });
  });
};
