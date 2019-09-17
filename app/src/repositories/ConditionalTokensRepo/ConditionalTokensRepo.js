const assert = require("assert");

class ConditionalTokensRepo {
  constructor({ contracts }) {
    assert(contracts, '"contracts" is required');

    this._conditionalTokens = contracts.pmSystem;
  }

  async getOutcomeSlotCount(id) {
    return this._conditionalTokens.getOutcomeSlotCount(id);
  }

  async conditionIds(index) {
    return this._conditionalTokens.conditionIds(index);
  }
}

module.exports = ConditionalTokensRepo;
