// let environment = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : 'local'
// process.env.NODE_ENV = environment === 'test' ? 'local' : environment

const networkToUse = process.env.NETWORK || "local";
let config = require(`./config.${networkToUse}.json`);

module.exports = config;
