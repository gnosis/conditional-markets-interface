import web3 from "web3";
import Decimal from "decimal.js";

import {
  lmsrMarginalPrice,
  lmsrNetCost,
} from './utils/lmsr'

import {
  getDefaultAccount,
  loadContract,
  loadConfig,
  getAccountBalance,
  getGasPrice
} from "./web3";
import {
  nameMarketOutcomes,
  nameOutcomePairs,
  getIndividualProbabilities
} from "./utils/probabilities";
import {
  loadMarketOutcomeCounts,
  loadLmsrTokenBalances,
  tryToDepositCollateral,
} from "./balances";

const { BN, toBN } = web3.utils;

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

const SHARE_AMOUNT_NONE = new BN(0);

export const loadProbabilitiesForPredictions = async (atomicOutcomePrices) => {
  const marketOutcomeCounts = await loadMarketOutcomeCounts()

  const individualProbabilities = getIndividualProbabilities(
    atomicOutcomePrices,
    marketOutcomeCounts,
    []
  );

  return individualProbabilities
}

/**
 * Fetches markets, transforms them, adds data from smart contracts and returns them.
 *
 * @param {*} assumedOutcomes Simulate prices, costs and probabilities with given outcomes
 */
let marketOutcomeCounts;
export const loadMarkets = async (atomicOutcomePrices, assumptions = []) => {
  // load hardcoded market entries from config
  const { markets } = await loadConfig();
  const marketOutcomeCounts = await loadMarketOutcomeCounts()

  const individualProbabilities = getIndividualProbabilities(
    atomicOutcomePrices,
    marketOutcomeCounts,
    assumptions
  );

  let lmsrIndex = 0
  const marketsWithData = markets.map((market, marketIndex) => {
    return {
      ...market,
      outcomes: market.outcomes.map((outcome, outcomeIndex) => ({
        ...outcome,
        lmsrIndex: lmsrIndex++,
        color: OUTCOME_COLORS[marketIndex * markets.length + outcomeIndex],
        probability: individualProbabilities[marketIndex][outcomeIndex]
      }))
    };
  });

  return marketsWithData;
};

export const loadMarginalPrices = async (tokenOffsets = []) => {
  // load hardcoded market entries from config
  const { lmsr } = await loadConfig();
  const LMSR = await loadContract("LMSRMarketMaker", lmsr);

  const funding = await LMSR.funding()
  const lmsrTokenBalances = await loadLmsrTokenBalances(lmsr)

  const cost = lmsrNetCost(funding, tokenOffsets, lmsrTokenBalances)

  const lmsrTokenBalancesAfter = lmsrTokenBalances.map((balance, index) => {
    if (!tokenOffsets[index]) return balance
    return new Decimal(balance).sub(new Decimal(tokenOffsets[index])).add(cost).toString()
  })

  // load all marginal prices for atomic outcomes e.g. (Ay&By&Cy)
  const atomicOutcomeCount = (await LMSR.atomicOutcomeSlotCount()).toNumber();
  const atomicOutcomePrices = await Promise.all(
    Array(atomicOutcomeCount)
      .fill()
      .map(async (_, index) => lmsrMarginalPrice(funding, lmsrTokenBalancesAfter, index).toString())
  );

  return atomicOutcomePrices;
};

export const loadCollateral = async () => {
  const { collateral } = await loadConfig();

  if (!collateral) {
    return {
      symbol: "E",
      decimals: 18,
      name: "ETH"
    }
  }

  if (collateral.toLowerCase() === "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359") {
    return {
      symbol: "DAI",
      decimals: 18,
      name: "MakerDAO Dai Stablecoin"
    }
  }

  const erc20 = await loadContract("ERC20Detailed", collateral);
  const symbol = await erc20.symbol()
  const name = await erc20.name()
  const decimals = await erc20.decimals()
  
  // return altered symbol and description for wrapped eth
  if (/^w?eth/i.test(symbol)) {
    return {
      symbol: "\u039E",
      decimals: 18,
      name: "ETH (Wrapped)"
    }
  }

  return {
    symbol,
    name,
    decimals: decimals.toNumber()
  }
}

export const buyOutcomes = async buyList => {
  // load all outcome prices
  const { lmsr, collateral } = await loadConfig();
  const LMSR = await loadContract("LMSRMarketMaker", lmsr);
  // get market maker instance
  // console.log("buy: ", buyList)
  const cost = await LMSR.calcNetCost.call(buyList);
  // console.log("cost: ", cost.toString())

  const defaultAccount = await getDefaultAccount();
  const prev = new Decimal(await getAccountBalance());

  // deposit and approve collateral, depositing only if collateral is wrapped eth
  await tryToDepositCollateral(collateral, LMSR.address, cost)
  const collateralContract = await loadContract("ERC20Detailed", collateral);
  await collateralContract.approve(lmsr, cost, { from: defaultAccount })

  // run trade
  const tx = await LMSR.trade(buyList, cost, { from: defaultAccount });

  // console.log(tx.receipt.gasUsed)
  const gasPrice = new Decimal(await getGasPrice());
  const gasCost = gasPrice.mul(tx.receipt.gasUsed);

  //const wait = await (new Promise((resolve) => setTimeout(resolve, 500)))

  const now = prev.plus(gasCost).sub(new Decimal(await getAccountBalance()));
  // console.log(`wei used for tx (excluding gas): ${(await getAccountBalance()).toString()}`)
  // console.log(tx);
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
  const tx = await LMSR.trade(sellList, cost, {
    from: defaultAccount,
    gas: 0x6691b7
  });
};
