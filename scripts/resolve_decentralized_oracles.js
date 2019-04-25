const DifficultyOracle = artifacts.require("DifficultyOracle");
const ETHValueOracle = artifacts.require("ETHValueOracle");
const GasLimitOracle = artifacts.require("GasLimitOracle");

const inquirer = require('inquirer');

module.exports = (callback) => {
  (new Promise(async (res, rej) => {
    let difficultyOracleInstance
    let ethValueOracleInstance
    let gasLimitOracleInstance
    try {
      difficultyOracleInstance = await DifficultyOracle.deployed()
      ethValueOracleInstance = await ETHValueOracle.deployed()
      gasLimitOracleInstance = await GasLimitOracle.deployed()
    } catch (err) {
      console.error("Please ensure the oracle contracts are deployed.")
      console.error(err.message)
      console.error(err.stack)
      rej(err)
    }

    console.log(`Difficult Oracle deployed at ${difficultyOracleInstance.address}`)
    console.log(`ETH Value Oracle deployed at ${ethValueOracleInstance.address}`)
    console.log(`Gas Limit Oracle deployed at ${gasLimitOracleInstance.address}`)

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'oracle',
        message: "Which oracle do you want to resolve?",
        choices: [{value: 'Difficulty', name: "Difficulty Oracle"}, {value: 'ETHValue', name: "ETH Value Oracle"}, {value: 'GasLimit', name: "Gas Limit Oracle"}]
      },
    ])

    console.log("Resolving...")
    let tx
    try {
      if (answers.oracle == 'Difficulty') {
        tx = await difficultyOracleInstance.resolveDifficulty()
      } else if (answers.oracle == 'ETHValue') {
        tx = await ethValueOracleInstance.resolveETHValue()
      } else if (answers.oracle == 'GasLimit') {
        tx = await gasLimitOracleInstance.resolveGasLimit()
      }
    } catch (err) {
      console.error(err)
      rej(err)
    }
    console.log(JSON.stringify(tx, null, 2))

    res()
  })).then(callback, (err) => {
    console.log("Oracle Resolve failed")
    console.error(err)
  })
}