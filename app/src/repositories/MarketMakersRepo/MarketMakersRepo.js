const assert = require("assert");

class MarketMakersRepo {
  constructor({ contracts }) {
    assert(contracts, '"contracts" is required');

    this._lmsrMarketMaker = contracts.lmsrMarketMaker;
  }

  async atomicOutcomeSlotCount() {
    return this._lmsrMarketMaker.atomicOutcomeSlotCount();
  }

  async conditionIds(index) {
    return this._lmsrMarketMaker.conditionIds(index);
  }

  async owner() {
    return this._lmsrMarketMaker.owner();
  }

  async funding() {
    return this._lmsrMarketMaker.funding();
  }

  async stage() {
    return this._lmsrMarketMaker.stage();
  }
}

module.exports = MarketMakersRepo;
