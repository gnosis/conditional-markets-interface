const fs = require("fs");
const path = require("path");

const CONFIG_FILE_PATH = path.join(
  __dirname,
  "..",
  "..",
  "app",
  "src",
  "conf",
  "config.local.json"
);

const writeToConfig = config => {
  let newConfig = config;
  if (fs.existsSync(CONFIG_FILE_PATH)) {
    fs.copyFileSync(CONFIG_FILE_PATH, `${CONFIG_FILE_PATH}.bak`);
    const existingConfig = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH));
    newConfig = Object.assign({}, existingConfig, config);
  }
  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(newConfig, null, 2));
};

module.exports = writeToConfig;
