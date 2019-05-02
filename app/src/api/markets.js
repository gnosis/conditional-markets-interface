import Web3 from "web3";
import Decimal from "decimal.js";

import { lmsrMarginalPrice, lmsrNetCost } from "./utils/lmsr";

import { getDefaultAccount, loadContract, loadConfig } from "./web3";
import {
  nameMarketOutcomes,
  nameOutcomePairs,
  getIndividualProbabilities
} from "./utils/probabilities";
import { loadMarketOutcomeCounts, loadLmsrTokenBalances } from "./balances";

const { toBN } = Web3.utils;

const OUTCOME_COLORS = [
  "#fbb4ae",
  "#b3cde3",
  "#b3cde3",
  "#ccebc5",
  "#decbe4",
  "#decbe4",
  "#fed9a6",
  "#ffffcc",
  "#ffffcc",
  "#e5d8bd",
  "#fddaec",
  "#f2f2f2"
];

export const loadProbabilitiesForPredictions = async atomicOutcomePrices => {
  const marketOutcomeCounts = await loadMarketOutcomeCounts();

  const individualProbabilities = getIndividualProbabilities(
    atomicOutcomePrices,
    marketOutcomeCounts,
    []
  );

  return individualProbabilities;
};

/**
 * Fetches markets, transforms them, adds data from smart contracts and returns them.
 *
 * @param {*} assumedOutcomes Simulate prices, costs and probabilities with given outcomes
 */
export const loadMarkets = async (atomicOutcomePrices, assumptions = []) => {
  // load hardcoded market entries from config
  const { markets } = await loadConfig();
  const marketOutcomeCounts = await loadMarketOutcomeCounts();

  const individualProbabilities = getIndividualProbabilities(
    atomicOutcomePrices,
    marketOutcomeCounts,
    assumptions
  );

  const PMSystem = await loadContract("PredictionMarketSystem");

  let lmsrIndex = 0;
  const marketsWithData = await Promise.all(
    markets.map(async (market, marketIndex) => {
      const payoutNumerators = await Promise.all(
        market.outcomes.map(async (outcome, outcomeIndex) => {
          const numerator = await PMSystem.payoutNumerators(
            market.conditionId,
            outcomeIndex
          );

          return numerator.toString();
        })
      );
      const payoutDenominator = await PMSystem.payoutDenominator(
        market.conditionId
      );
      // only works with binary for now
      const result = payoutNumerators.findIndex(numerator =>
        Decimal(numerator).gt(new Decimal(0))
      );
      const resolved = new Decimal(payoutDenominator.toString()).gt(
        new Decimal(0)
      );

      return {
        ...market,
        isResolved: resolved,
        result,
        outcomes: market.outcomes.map((outcome, outcomeIndex) => ({
          ...outcome,
          outcomeIndex,
          lmsrIndex: lmsrIndex++,
          color: OUTCOME_COLORS[marketIndex * markets.length + outcomeIndex],
          probability: individualProbabilities[marketIndex][outcomeIndex]
        }))
      };
    })
  );

  return marketsWithData;
};

export const loadMarginalPrices = async (tokenOffsets = []) => {
  // load hardcoded market entries from config
  const { lmsr } = await loadConfig();
  const LMSR = await loadContract("LMSRMarketMaker", lmsr);

  const funding = await LMSR.funding();
  const lmsrTokenBalances = await loadLmsrTokenBalances(lmsr);

  const cost = lmsrNetCost(funding, tokenOffsets, lmsrTokenBalances);

  const lmsrTokenBalancesAfter = lmsrTokenBalances.map((balance, index) => {
    if (!tokenOffsets[index]) return balance;
    return new Decimal(balance)
      .sub(new Decimal(tokenOffsets[index]))
      .add(cost)
      .toString();
  });

  // load all marginal prices for atomic outcomes e.g. (Ay&By&Cy)
  const atomicOutcomeCount = (await LMSR.atomicOutcomeSlotCount()).toNumber();
  const atomicOutcomePrices = await Promise.all(
    Array(atomicOutcomeCount)
      .fill()
      .map(async (_, index) =>
        lmsrMarginalPrice(funding, lmsrTokenBalancesAfter, index).toString()
      )
  );

  return atomicOutcomePrices;
};

export const loadCollateral = async () => {
  const { collateral } = await loadConfig();

  if (!collateral) {
    return {
      symbol: "?",
      decimals: 18,
      name: "???"
    };
  }

  if (
    collateral.toLowerCase() === "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359"
  ) {
    return {
      symbol: "\u25C8",
      decimals: 18,
      name: "MakerDAO Dai Stablecoin"
    };
  }

  const erc20 = await loadContract("ERC20Detailed", collateral);
  const symbol = await erc20.symbol();
  const name = await erc20.name();
  const decimals = await erc20.decimals();

  // return altered symbol and description for wrapped eth
  if (/^w?eth/i.test(symbol)) {
    return {
      symbol: "\u039E",
      decimals: 18,
      name: "ETH (Wrapped)",
      isWETH: true
    };
  }

  return {
    symbol,
    name,
    decimals: decimals.toNumber()
  };
};

export const buyOutcomes = async (
  collateralInfo,
  collateralBalance,
  buyList
) => {
  const { lmsr, collateral } = await loadConfig();
  const LMSR = await loadContract("LMSRMarketMaker", lmsr);
  const cost = await LMSR.calcNetCost.call(buyList);

  const defaultAccount = await getDefaultAccount();

  const collateralContract = await loadContract("WETH9", collateral);
  const balance = collateralBalance.amount;
  let ethBalance = await LMSR.constructor.web3.eth.getBalance(defaultAccount);
  if (collateralInfo.isWETH) {
    if (balance.lt(cost.toString())) {
      await collateralContract.deposit({
        value: cost.sub(toBN(balance.toString())),
        from: defaultAccount
      });
      ethBalance = await LMSR.constructor.web3.eth.getBalance(defaultAccount);
    }
    const gasPrice = toBN(
      LMSR.constructor.defaults().gasPrice ||
        (await LMSR.constructor.web3.eth.getGasPrice())
    );
    const gasEstimate = await LMSR.trade.estimateGas(buyList, cost, {
      from: defaultAccount
    });
    const estimatedGasCost = gasPrice.muln(gasEstimate);
    if (estimatedGasCost.gt(ethBalance)) {
      if (balance.gt(cost.toString()))
        await collateralContract.withdraw(
          balance.sub(cost.toString()).toString(),
          { from: defaultAccount }
        );
    }
  }

  // run trade
  await LMSR.trade(buyList, cost, { from: defaultAccount });
};

export const sellOutcomes = async (atomicOutcomes, amount) => {
  const { lmsr } = await loadConfig();

  const marketOutcomeCounts = await loadMarketOutcomeCounts();
  const outcomeIdNames = nameMarketOutcomes(marketOutcomeCounts);
  const outcomePairNames = nameOutcomePairs(outcomeIdNames);

  const sellList = outcomePairNames.map(atomicOutcome => {
    if (atomicOutcomes.includes(atomicOutcome)) {
      return toBN(amount).neg();
    }

    return toBN(0);
  });

  // load all outcome prices
  const LMSR = await loadContract("LMSRMarketMaker", lmsr);
  const PMSystem = await loadContract("PredictionMarketSystem");

  // get market maker instance
  const cost = await LMSR.calcNetCost.call(sellList);

  const defaultAccount = await getDefaultAccount();

  // set approval
  await PMSystem.setApprovalForAll(lmsr, true, {
    from: defaultAccount
  });
  // console.log("approval set");
  // run trade
  await LMSR.trade(sellList, cost, { from: defaultAccount });
};
