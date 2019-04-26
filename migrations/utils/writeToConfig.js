const fs = require("fs");
const path = require("path");

const CONFIG_FILE_PATH = path.join(__dirname, "..", "..", "app", "config.json");

const writeToConfig = (network, { conditionIds, ...extraConfig }) => {
  const existingConfig = fs.readFileSync(CONFIG_FILE_PATH);
  fs.writeFileSync(`${CONFIG_FILE_PATH}.bak`, existingConfig.toString());

  const configParsed = JSON.parse(existingConfig);
  const networkName = network.toUpperCase();
  const networkConfig = configParsed[networkName] || {};

  const newConfig = {
    ...configParsed,
    [networkName]: {
      ...networkConfig
    }
  };

  if (conditionIds) {
    if (networkConfig.markets.length !== conditionIds.length)
      throw new Error(
        `number of markets ${
          networkConfig.markets.length
        } different from number of condition ids ${conditionIds.length}`
      );

    newConfig[networkName].markets = networkConfig.markets.map(
      (market, index) => ({
        ...market,
        conditionId: conditionIds[index]
      })
    );
  }

  Object.assign(newConfig[networkName], extraConfig);

  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(newConfig, null, 2));
};

module.exports = writeToConfig;
