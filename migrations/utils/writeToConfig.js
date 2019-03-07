const fs = require("fs")
const path = require("path")

const CONFIG_FILE_PATH = path.join(__dirname, "..", "..", "app", "config.json")

const writeToConfig = (network, { conditionIds, lmsr, collateral }) => {
  console.log(`writing to config  for ${network}`)

  const existingConfig = fs.readFileSync(CONFIG_FILE_PATH)
  const backup = fs.writeFileSync(`${CONFIG_FILE_PATH}.bak`, existingConfig.toString())

  const configParsed = JSON.parse(existingConfig)
  const networkName = network.toUpperCase()
  const networkConfig = configParsed[networkName]


  // sanity checks
  if (networkConfig == null) {
    console.warn(`Key does not exist. Adding the network key ${networkName} to the config`)

    networkConfig = {}
  }

  const newConfig = {
    ...configParsed,
    [networkName]: {
      ...networkConfig,
    }
  }

  if (conditionIds) {
    if (networkConfig.markets.length !== conditionIds.length) {
      console.warn(`Wrong amount of markets in config, ${conditionIds.length} conditions generated, ${networkConfig.markets.length} markets in file`)
  
      if (networkConfig.markets.length < conditionIds.length) {
        throw new Error("Too many markets, not enough conditionIds to fill")
      } else {
        console.warn(`Only filling first ${conditionIds.length} markets with new conditionIds`)
      }
    }
  
    newConfig[networkName].markets = networkConfig.markets.map((market, index) => ({
      ...market,
      conditionId: conditionIds[index]
    }))
  }

  if (lmsr) {
    newConfig[networkName].lmsr = lmsr
  }

  if (collateral) {
    newConfig[networkName].collateral = collateral
  }
  
  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(newConfig, null, 2))
  console.log("Wrote new config!")

}

module.exports = writeToConfig