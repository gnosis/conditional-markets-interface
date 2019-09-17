const conf = require("../../conf");
const MarketMakersRepo = require("./MarketMakersRepo");
import loadContracts from "../../loadContracts";

let instance, instancePromise;

async function _getInstance() {
  // Get factory
  // const {
  //   Factory: AuctionRepo,
  //   factoryConf: auctionRepoConf
  // } = conf.getFactory('AUCTION_REPO')

  // Get contracts
  // const loadContracts = require
  const contracts = await loadContracts();

  // Get ethereum client
  // const getEthereumClient = require('../../helpers/ethereumClient')
  // const ethereumClient = await getEthereumClient()

  // const {
  //   CACHE,
  //   DEFAULT_GAS,
  //   TRANSACTION_RETRY_TIME,
  //   GAS_RETRY_INCREMENT,
  //   OVER_FAST_PRICE_FACTOR,
  //   GAS_ESTIMATION_CORRECTION_FACTOR,
  //   DEFAULT_GAS_PRICE_USED
  // } = conf

  return new MarketMakersRepo({
    // ethereumClient,
    contracts // ,

    // Cache
    // cacheConf: CACHE,
    //
    // // Gas price
    // defaultGas: DEFAULT_GAS,
    // gasPriceDefault: DEFAULT_GAS_PRICE_USED,
    //
    // // Retry logic
    // transactionRetryTime: TRANSACTION_RETRY_TIME,
    // gasRetryIncrement: GAS_RETRY_INCREMENT,
    // overFastPriceFactor: OVER_FAST_PRICE_FACTOR,
    // gasEstimationCorrectionFactor: GAS_ESTIMATION_CORRECTION_FACTOR,
    //
    // // Override config
    // ...auctionRepoConf
  });
}

export default async () => {
  if (!instance) {
    if (!instancePromise) {
      instancePromise = _getInstance();
    }

    instance = await instancePromise;
  }

  return instance;
};
