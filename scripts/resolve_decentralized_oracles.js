const DutchXTokenPriceOracle = artifacts.require("DutchXTokenPriceOracle");
const TokenSupplyOracle = artifacts.require("TokenSupplyOracle");
const DaiStabilityFeeOracle = artifacts.require("DaiStabilityFeeOracle");

const inquirer = require("inquirer");

module.exports = callback => {
  new Promise(async (res, rej) => {
    let daiPriceOracle;
    let daiSupplyOracle;
    let daiStabilityFeeOracle;
    try {
      daiPriceOracle = await DutchXTokenPriceOracle.deployed();
      daiSupplyOracle = await TokenSupplyOracle.deployed();
      daiStabilityFeeOracle = await DaiStabilityFeeOracle.deployed();
    } catch (err) {
      console.error("Please ensure the oracle contracts are deployed.");
      console.error(err.message);
      console.error(err.stack);
      rej(err);
    }

    console.log(`DAI Price Oracle deployed at ${daiPriceOracle.address}`);
    console.log(`DAI Supply Oracle deployed at ${daiSupplyOracle.address}`);
    console.log(
      `DAI Stability Oracle deployed at ${daiStabilityFeeOracle.address}`
    );

    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "oracle",
        message: "Which oracle do you want to resolve?",
        choices: [
          { value: "DAIPrice", name: "DAI Price Oracle" },
          { value: "DAISupply", name: "DAI Supply Oracle" },
          { value: "DAIStability", name: "DAI Stability Oracle" }
        ]
      }
    ]);

    console.log("Resolving...");

    try {
      if (answers.oracle == "DAIPrice") {
        await daiPriceOracle.resolveValue();
      } else if (answers.oracle == "DAISupply") {
        await daiSupplyOracle.resolveValue();
      } else if (answers.oracle == "DAIStability") {
        await daiStabilityFeeOracle.resolveValue();
      }
    } catch (err) {
      console.error(err);
      return rej(err);
    }

    console.log("Resolution successful!");
    res();
  }).then(callback, err => {
    console.log("Oracle Resolve failed");
    console.error(err);
    callback(err);
  });
};
