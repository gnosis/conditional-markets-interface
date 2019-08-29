require("dotenv").config();

var HDWalletProvider = require("truffle-hdwallet-provider");

const seed =
  process.env.SEED ||
  "brand gallery sock inspire error kitten orphan arch unaware palace twin soft";

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

const createInfuraEntry = (networkName, networkId, gasPrice) => ({
  [networkName]: {
    provider: () =>
      new HDWalletProvider(
        seed,
        `https://${networkName}.infura.io/v3/d743990732244555a1a0e82d5ab90c7f`
      ),
    network_id: networkId,
    gasPrice,
    // See issues:
    //   https://github.com/trufflesuite/truffle/issues/1612
    //   https://github.com/trufflesuite/truffle/issues/1698
    skipDryRun: true
  }
});

const config = {
  networks: Object.assign(
    {
      development: {
        host: "127.0.0.1",
        port: 8545,
        network_id: "*",
        from: process.env.FROM_ACCOUNT
      },
      mainnet: {
        provider: () =>
          new HDWalletProvider(seed, "https://node-green.mainnet.gnosis.pm"),
        network_id: "1",
        skipDryRun: true,
        gasPrice: 3e9
      },
      rinkeby: {
        provider: () =>
          new HDWalletProvider(seed, "https://node.rinkeby.gnosisdev.com:443"),
        network_id: "4",
        skipDryRun: true,
        gasPrice: 3e9
      }
    },
    ...[["ropsten", "3"], ["kovan", "42"], ["goerli", "5", 1e9]].map(
      networkInfo => createInfuraEntry(...networkInfo)
    )
  ),
  compilers: {
    solc: {
      version: "0.5.1"
    }
  },
  build: "webpack"
};

module.exports = config;
