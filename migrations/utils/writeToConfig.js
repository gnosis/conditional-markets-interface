const fs = require("fs");
const path = require("path");

const CONFIG_FILE_PATH = path.join(__dirname, "..", "..", "app", "config.json");

const writeToConfig = (network, { conditionIds, lmsr, collateral }) => {
  const existingConfig = fs.readFileSync(CONFIG_FILE_PATH);
  fs.writeFileSync(`${CONFIG_FILE_PATH}.bak`, existingConfig.toString());

  const configParsed = JSON.parse(existingConfig);
  const networkName = network.toUpperCase();
  const networkConfig = configParsed[networkName] || {};

  // sanity checks
  if (networkConfig == null) {
    throw new Error(`missing config for network ${networkName}`);
  }

  const newConfig = {
    ...configParsed,
    [networkName]: {
      ...networkConfig
    }
  };

  if (conditionIds) {
    if (networkConfig.markets.length !== conditionIds.length) {
      if (networkConfig.markets.length < conditionIds.length) {
        throw new Error("Too many markets, not enough conditionIds to fill");
      }
    }

    newConfig[networkName].markets = networkConfig.markets.map(
      (market, index) => ({
        ...market,
        conditionId: conditionIds[index]
      })
    );
  }

  if (lmsr) {
    newConfig[networkName].lmsr = lmsr;
  }

  if (collateral) {
    newConfig[networkName].collateral = collateral;
  }

  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(newConfig, null, 2));
};

module.exports = writeToConfig;
