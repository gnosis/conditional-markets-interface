// let environment = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : 'local'
// process.env.NODE_ENV = environment === 'test' ? 'local' : environment

// Load network conf
const network = process.env.NETWORK
  ? process.env.NETWORK.toLowerCase()
  : "local";
const networkConfig = network ? require(`./config.${network}.json`) : {};

// Whitelist conf
const whitelistConfig = require(`./config-whitelist`);

// Load custom config file (override default conf)
const customConfigFile = process.env.CONFIG_FILE;
let customConfig = customConfigFile ? require(customConfigFile) : {};

let config = {
  ...networkConfig,
  ...whitelistConfig,
  ...customConfig
};

module.exports = config;
