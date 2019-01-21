require('dotenv').config();

var HDWalletProvider = require("truffle-hdwallet-provider");

const seed = process.env.SEED || 'witch collapse practice feed shame open despair creek road again ice least' 

/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a 
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() { 
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>') 
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */
const config = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*"
    },
    rinkeby: {
      provider: () => {
       return new HDWalletProvider(seed, "https://rinkeby.infura.io/v3/22218302c99b4ee29f8a5876ad0b552c"); 
      }, 
      network_id: "4"
    }
  },
  compilers: {
    solc: {
      version: "0.5.1"
    }
  },
  build: 'webpack'
}

module.exports = config;
