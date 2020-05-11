import assert from "assert";
import { zeroDecimal, maxUint256BN } from "utils/constants";
import { formatCollateral } from "utils/formatting";
import ToastifyError from "utils/ToastifyError";
import { getCurrentUserTierData } from "utils/tiers";
import {
  getTiersLimit,
  getUserState,
  postTradingVolumeSimulation
} from "api/onboarding";

import conf from "conf";
const ONBOARDING_MODE = conf.ONBOARDING_MODE;

export default class ConditionalTokensService {
  constructor({ web3, marketMakersRepo, conditionalTokensRepo }) {
    assert(web3, '"web3" instance is required');
    assert(marketMakersRepo, '"marketMakersRepo" is required');
    assert(conditionalTokensRepo, '"conditionalTokensRepo" is required');

    this._web3 = web3;
    this._marketMakersRepo = marketMakersRepo;
    this._conditionalTokensRepo = conditionalTokensRepo;
  }

  getCollateralToken() {
    return this._marketMakersRepo.getCollateralToken();
  }

  async getAtomicOutcomeSlotCount() {
    return this._marketMakersRepo
      .atomicOutcomeSlotCount()
      .then(result => result.toNumber());
  }

  async getPositionBalances(positions, account) {
    return Promise.all(
      positions.map(position =>
        this._conditionalTokensRepo.balanceOf(account, position.id)
      )
    );
  }

  async getLMSRState(positions) {
    const { fromWei } = this._web3.utils;
    const marketMakerAddress = this._marketMakersRepo.getAddress();
    const [owner, funding, stage, fee, positionBalances] = await Promise.all([
      this._marketMakersRepo.owner(),
      this._marketMakersRepo.funding(),
      this._marketMakersRepo
        .stage()
        .then(stage => ["Running", "Paused", "Closed"][stage.toNumber()]),
      this._marketMakersRepo.fee().then(fee => fromWei(fee)),
      this.getPositionBalances(positions, marketMakerAddress)
    ]);

    return { owner, funding, stage, fee, positionBalances, marketMakerAddress };
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

  async getCollateralBalance(account) {
    const collateralBalance = {};
    const collateral = this._marketMakersRepo.getCollateralToken();

    collateralBalance.amount = await collateral.contract.balanceOf(account);
    if (collateral.isWETH) {
      collateralBalance.unwrappedAmount = this._web3.utils.toBN(
        await this._web3.eth.getBalance(account)
      );
      collateralBalance.totalAmount = collateralBalance.amount.add(
        collateralBalance.unwrappedAmount
      );
    } else {
      collateralBalance.totalAmount = collateralBalance.amount;
    }

    return collateralBalance;
  }

  async getLMSRAllowance(account) {
    const [marketMakerAddress, collateral] = await Promise.all([
      this._marketMakersRepo.getAddress(),
      this._marketMakersRepo.getCollateralToken()
    ]);

    return collateral.contract.allowance(account, marketMakerAddress);
  }

  async getOutcomeSlotCount(id) {
    return this._conditionalTokensRepo.getOutcomeSlotCount(id);
  }

  async calcNetCost(amounts) {
    return this._marketMakersRepo.calcNetCost(amounts);
  }

  async isTierLimitExceeded({ account, collateral, investmentAmount }) {
    if (ONBOARDING_MODE === "TIERED") {
      const [tiers, userState, tradingVolumeSimulation] = await Promise.all([
        getTiersLimit(),
        getUserState(account),
        postTradingVolumeSimulation(account, {
          buyVolumes: [
            {
              collateralToken: collateral.address,
              amount: investmentAmount
            }
          ]
        }).then(({ buyVolume }) => buyVolume.dollars)
      ]);

      const currentUserTierData = getCurrentUserTierData(tiers, userState);

      if (
        // Tier 3 unlimited is returned as 0 limit
        Number.parseFloat(currentUserTierData.limit) !== 0 &&
        // Otherwise we check if we are over limit
        Number.parseFloat(currentUserTierData.limit) <
          Number.parseFloat(tradingVolumeSimulation)
      ) {
        return {
          overLimit: true,
          currentUserTierData,
          volumeAfterTrade: tradingVolumeSimulation
        };
      } else {
        return {
          overLimit: false
        };
      }
    } else {
      return {
        overLimit: false
      };
    }
  }

  async needsMoreAllowance({ investmentAmount, account, collateralBalance }) {
    const collateral = await this._marketMakersRepo.getCollateralToken();

    const tierLimitStatus = await this.isTierLimitExceeded({
      account,
      collateral,
      investmentAmount
    });

    if (tierLimitStatus.overLimit) {
      const { currentUserTierData, volumeAfterTrade } = tierLimitStatus;
      return {
        modal: "TradeOverLimit",
        modalProps: {
          address: account,
          tier: currentUserTierData.name,
          maxVolume: currentUserTierData.limit,
          volume: volumeAfterTrade
        }
      };
    }

    let investmentAmountInUnits;
    try {
      investmentAmountInUnits = collateral.toUnitsMultiplier.mul(
        investmentAmount
      );
    } catch (err) {
      investmentAmountInUnits = zeroDecimal;
    }

    if (investmentAmountInUnits.gt(collateralBalance.totalAmount.toString()))
      throw new ToastifyError(
        `Not enough collateral: missing ${formatCollateral(
          investmentAmountInUnits.sub(collateralBalance.totalAmount.toString()),
          collateral
        )}`
      );

    const lmsrAllowance = await this.getLMSRAllowance(account);
    const hasEnoughAllowance = investmentAmountInUnits.lte(
      lmsrAllowance.toString()
    );

    //console.log(investmentAmountInUnits.toString(), lmsrAllowance.toString())
    //console.log(hasEnoughAllowance)

    return !hasEnoughAllowance;
  }

  async setAllowance({
    investmentAmount,
    stagedTradeAmounts,
    account,
    collateralBalance
  }) {
    if (stagedTradeAmounts == null)
      throw new ToastifyError(`No buy amount set yet`);

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
      throw new ToastifyError(
        `Not enough collateral: missing ${formatCollateral(
          investmentAmountInUnits.sub(collateralBalance.totalAmount.toString()),
          collateral
        )}`
      );

    const lmsrAllowance = await this.getLMSRAllowance(account);
    const hasEnoughAllowance = investmentAmountInUnits.lte(
      lmsrAllowance.toString()
    );

    if (!hasEnoughAllowance) {
      const marketMakerAddress = await this._marketMakersRepo.getAddress();
      await collateral.contract.approve(
        marketMakerAddress,
        maxUint256BN.toString(10),
        {
          from: account
        }
      );
    }
  }

  async buyOutcomeTokens({
    investmentAmount,
    stagedTradeAmounts,
    stagedTransactionType,
    account,
    collateralBalance
  }) {
    if (stagedTradeAmounts == null)
      throw new ToastifyError(`No buy amount set yet`);

    if (stagedTransactionType !== "buy outcome tokens")
      throw new ToastifyError(
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
      throw new ToastifyError(
        `Not enough collateral: missing ${formatCollateral(
          investmentAmountInUnits.sub(collateralBalance.totalAmount.toString()),
          collateral
        )}`
      );

    const tierLimitStatus = await this.isTierLimitExceeded({
      account,
      collateral,
      investmentAmount
    });

    if (tierLimitStatus.overLimit) {
      const { currentUserTierData, volumeAfterTrade } = tierLimitStatus;
      return {
        modal: "TradeOverLimit",
        modalProps: {
          address: account,
          tier: currentUserTierData.name,
          maxVolume: currentUserTierData.limit,
          volume: volumeAfterTrade
        }
      };
    }

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

    return this._marketMakersRepo.trade(tradeAmounts, collateralLimit, account);
  }

  async sellOutcomeTokens({
    stagedTradeAmounts,
    stagedTransactionType,
    account
  }) {
    if (stagedTradeAmounts == null)
      throw new ToastifyError(`No sell amount selected`);

    if (stagedTransactionType !== "sell outcome tokens")
      throw new ToastifyError(
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
