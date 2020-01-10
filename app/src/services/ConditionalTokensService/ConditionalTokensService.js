const assert = require("assert");
import { zeroDecimal, maxUint256BN, oneDecimal } from "utils/constants";
import { formatScalarValue, formatCollateral } from "utils/formatting";

export default class ConditionalTokensService {
  constructor({ marketMakersRepo, conditionalTokensRepo }) {
    assert(marketMakersRepo, '"marketMakersRepo" is required');
    assert(conditionalTokensRepo, '"conditionalTokensRepo" is required');

    this._marketMakersRepo = marketMakersRepo;
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

  async calcNetCost(amounts) {
    return this._marketMakersRepo.calcNetCost(amounts);
  }

  async buyOutcomeTokens({
    investmentAmount,
    stagedTradeAmounts,
    stagedTransactionType,
    account,
    collateralBalance,
    hasAnyAllowance,
    hasEnoughAllowance
  }) {
    if (stagedTradeAmounts == null) throw new Error(`No buy set yet`);

    if (stagedTransactionType !== "buy outcome tokens")
      throw new Error(
        `Can't buy outcome tokens while staged transaction is to ${stagedTransactionType}`
      );

    const collateral = await this._marketMakersRepo.getCollateralToken();

    let investmentAmountInUnits;
    try {
      investmentAmountInUnits = collateral.toUnitsMultiplier.mul(
        investmentAmount
      );
    } catch (err) {
      investmentAmountInUnits = zeroDecimal;
    }

    if (investmentAmountInUnits.gt(collateralBalance.totalAmount.toString()))
      throw new Error(
        `Not enough collateral: missing ${formatCollateral(
          investmentAmountInUnits.sub(collateralBalance.totalAmount.toString()),
          collateral
        )}`
      );

    const tradeAmounts = stagedTradeAmounts.map(amount => amount.toString());
    const collateralLimit = await this._marketMakersRepo.calcNetCost(
      tradeAmounts
    );

    if (collateral.isWETH && collateralLimit.gt(collateralBalance.amount)) {
      await collateral.contract.deposit({
        value: collateralLimit.sub(collateralBalance.amount),
        from: account
      });
    }

    if (!hasAnyAllowance || !hasEnoughAllowance) {
      const marketMakerAddress = await this._marketMakersRepo.getAddress();
      await collateral.contract.approve(
        marketMakerAddress,
        maxUint256BN.toString(10),
        {
          from: account
        }
      );
    }

    return this._marketMakersRepo.trade(tradeAmounts, collateralLimit, account);
  }

  async sellOutcomeTokens({
    stagedTradeAmounts,
    stagedTransactionType,
    account
  }) {
    if (stagedTradeAmounts == null) throw new Error(`No sell set yet`);

    if (stagedTransactionType !== "sell outcome tokens")
      throw new Error(
        `Can't sell outcome tokens while staged transaction is to ${stagedTransactionType}`
      );

    const marketMakerAddress = await this._marketMakersRepo.getAddress();
    const isAccountApproved = await this._conditionalTokensRepo.isApprovedForAll(
      account,
      marketMakerAddress
    );
    if (!isAccountApproved) {
      await this._conditionalTokensRepo.setApprovalForAll(
        marketMakerAddress,
        true,
        account
      );
    }

    const tradeAmounts = stagedTradeAmounts.map(amount => amount.toString());
    const collateralLimit = await this._marketMakersRepo.calcNetCost(
      tradeAmounts
    );

    return this._marketMakersRepo.trade(tradeAmounts, collateralLimit, account);
  }
}
