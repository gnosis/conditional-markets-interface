const assert = require("assert");

class MarketMakersRepo {
  constructor({ contracts }) {
    assert(contracts, '"contracts" is required');

    this._lmsrMarketMaker = contracts.lmsrMarketMaker;
  }

  async conditionIds(index) {
    return this._lmsrMarketMaker.conditionIds(index);
  }

  async atomicOutcomeSlotCount() {
    return this._lmsrMarketMaker.atomicOutcomeSlotCount();
  }

  async owner() {
    return this._lmsrMarketMaker.owner();
  }

  async fee() {
    return this._lmsrMarketMaker.fee();
  }

  async funding() {
    return this._lmsrMarketMaker.funding();
  }

  async stage() {
    return this._lmsrMarketMaker.stage();
  }

  async calcNetCost(outcomeTokenAmounts) {
    return this._lmsrMarketMaker.calcNetCost(outcomeTokenAmounts);
  }

  async trade(tradeAmounts, collateralLimit, from) {
    return this._lmsrMarketMaker.trade(tradeAmounts, collateralLimit, { from });
  }
}

module.exports = MarketMakersRepo;
