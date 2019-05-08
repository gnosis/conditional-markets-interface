const rlp = require("rlp");
const writeToConfig = require("./utils/writeToConfig");

const defaultAMMFunding = web3.utils.toBN(1e19);

module.exports = function(deployer) {
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

    const collateralToken = await artifacts.require("WETH9").deployed();

    const lmsrMarketMakerFactory = await artifacts
      .require("LMSRMarketMakerFactory")
      .deployed();

    const lmsrAddress = web3.utils.toChecksumAddress(
      web3.utils
        .keccak256(
          rlp.encode([
            lmsrMarketMakerFactory.address,
            await web3.eth.getTransactionCount(lmsrMarketMakerFactory.address)
          ])
        )
        .substr(26)
    );

    await collateralToken.deposit({
      value: process.env.AMMFUNDING || defaultAMMFunding
    });

    await collateralToken.approve(
      lmsrAddress,
      process.env.AMMFUNDING || defaultAMMFunding
    );

    await lmsrMarketMakerFactory.createLMSRMarketMaker(
      artifacts.require("PredictionMarketSystem").address,
      collateralToken.address,
      conditionIds,
      0,
      process.env.AMMFUNDING || defaultAMMFunding
    );
    writeToConfig({
      networkId: await web3.eth.net.getId(),
      lmsrAddress
    });
  });
};
