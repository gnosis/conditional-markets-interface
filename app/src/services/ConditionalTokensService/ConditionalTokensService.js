const assert = require("assert");

class ConditionalTokensService {
  constructor({ conditionalTokensRepo }) {
    assert(conditionalTokensRepo, '"conditionalTokensRepo" is required');

    this._conditionalTokensRepo = conditionalTokensRepo;
  }

  async getPositionBalances(positions, account) {
    return Promise.all(
      positions.map(position =>
        this._conditionalTokensRepo.balanceOf(account, position.id)
      )
    );
  }

  async getMarketResolutionStates(markets) {
    return Promise.all(
      markets.map(async ({ conditionId, outcomes }) => {
        const payoutDenominator = await this._conditionalTokensRepo.payoutDenominator(
          conditionId
        );
        if (payoutDenominator.gtn(0)) {
          const payoutNumerators = await Promise.all(
            outcomes.map((_, outcomeIndex) =>
              this._conditionalTokensRepo.payoutNumerators(
                conditionId,
                outcomeIndex
              )
            )
          );

          return {
            isResolved: true,
            payoutNumerators,
            payoutDenominator
          };
        } else return { isResolved: false };
      })
    );
  }
}

module.exports = ConditionalTokensService;
