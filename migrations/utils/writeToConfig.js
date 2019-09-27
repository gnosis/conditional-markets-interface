const fs = require("fs");
const path = require("path");

const writeToConfig = config => {
  const configName = `config.${config.network}.json`;
  const CONFIG_FILE_PATH = path.join(__dirname, "..", "..", "app", configName);

  if (fs.existsSync(CONFIG_FILE_PATH)) {
    fs.copyFileSync(CONFIG_FILE_PATH, `${CONFIG_FILE_PATH}.bak`);
  }
  const existingConfig = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH));
  const newConfig = Object.assign({}, existingConfig, config);
  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(newConfig, null, 2));
};

module.exports = writeToConfig;
