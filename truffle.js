var HDWalletProvider = require("truffle-hdwallet-provider");

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
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
      port: 7545,
      network_id: "*"
    },
    rinkeby: {
      provider: () => {
       return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/v3/22218302c99b4ee29f8a5876ad0b552c"); 
      }, 
      network_id: "4"
    }
  },
  compilers: {
    solc: {
      version: "0.5.1"
    }
  }
}

module.exports = config;
