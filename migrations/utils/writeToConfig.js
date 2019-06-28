const fs = require("fs");
const path = require("path");

const CONFIG_FILE_PATH = path.join(__dirname, "..", "..", "src", "config.json");

const writeToConfig = config => {
  fs.copyFileSync(CONFIG_FILE_PATH, `${CONFIG_FILE_PATH}.bak`);
  const existingConfig = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH));
  const newConfig = Object.assign({}, existingConfig, config);
  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(newConfig, null, 2));
};

module.exports = writeToConfig;
