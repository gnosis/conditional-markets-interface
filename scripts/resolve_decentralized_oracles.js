const DifficultyOracle = artifacts.require("DifficultyOracle");
const GasLimitOracle = artifacts.require("GasLimitOracle");
const ETHValueOracle = artifacts.require("ETHValueOracle");

const inquirer = require("inquirer");

module.exports = callback => {
  new Promise(async (res, rej) => {
    let difficultyOracleInstance;
    let ethValueOracleInstance;
    let gasLimitOracleInstance;
    try {
      difficultyOracleInstance = await DifficultyOracle.deployed();
      gasLimitOracleInstance = await GasLimitOracle.deployed();
      ethValueOracleInstance = await ETHValueOracle.deployed();
    } catch (err) {
      console.error("Please ensure the oracle contracts are deployed.");
      console.error(err.message);
      console.error(err.stack);
      rej(err);
    }

    console.log(
      `Difficult Oracle deployed at ${difficultyOracleInstance.address}`
    );
    console.log(
      `Gas Limit Oracle deployed at ${gasLimitOracleInstance.address}`
    );
    console.log(
      `ETH Value Oracle deployed at ${ethValueOracleInstance.address}`
    );

    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "oracle",
        message: "Which oracle do you want to resolve?",
        choices: [
          { value: "Difficulty", name: "Difficulty Oracle" },
          { value: "GasLimit", name: "Gas Limit Oracle" },
          { value: "ETHValue", name: "ETH Value Oracle" }
        ]
      }
    ]);

    console.log("Resolving...");

    try {
      if (answers.oracle == "Difficulty") {
        await difficultyOracleInstance.resolveDifficulty();
      } else if (answers.oracle == "GasLimit") {
        await gasLimitOracleInstance.resolveGasLimit();
      } else if (answers.oracle == "ETHValue") {
        await ethValueOracleInstance.resolveETHValue();
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
