import web3 from "web3";
import Decimal from "decimal.js";

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
import { loadMarketOutcomeCounts } from "./balances";

const { BN } = web3.utils;

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

/**
 * Fetches markets, transforms them, adds data from smart contracts and returns them.
 *
 * @param {*} assumedOutcomes Simulate prices, costs and probabilities with given outcomes
 */
let marketOutcomeCounts;
export const loadMarkets = async (atomicOutcomePrices, assumptions = []) => {
  // load hardcoded market entries from config
  const { markets } = await loadConfig();

  if (!marketOutcomeCounts) {
    // load contracts
    const PMSystem = await loadContract("PredictionMarketSystem");

    marketOutcomeCounts = await Promise.all(
      markets.map(async market =>
        (await PMSystem.getOutcomeSlotCount(market.conditionId)).toNumber()
      )
    );
  }

  const individualProbabilities = getIndividualProbabilities(
    atomicOutcomePrices,
    marketOutcomeCounts,
    assumptions
  );

  const marketsWithData = markets.map((market, marketIndex) => {
    return {
      ...market,
      outcomes: market.outcomes.map((outcome, outcomeIndex) => ({
        ...outcome,
        color: OUTCOME_COLORS[marketIndex * markets.length + outcomeIndex],
        probability: individualProbabilities[marketIndex][outcomeIndex]
      }))
    };
  });

  return marketsWithData;
};

export const loadMarginalPrices = async () => {
  // load hardcoded market entries from config
  const { lmsr } = await loadConfig();
  const LMSR = await loadContract("LMSRMarketMaker", lmsr);

  // load all marginal prices for atomic outcomes e.g. (Ay&By&Cy)
  const atomicOutcomeCount = (await LMSR.atomicOutcomeSlotCount()).toNumber();
  const atomicOutcomePrices = await Promise.all(
    Array(atomicOutcomeCount)
      .fill()
      .map(async (_, index) => (await LMSR.calcMarginalPrice(index)).toString())
  );

  // console.log("marginal prices:", atomicOutcomePrices)

  return atomicOutcomePrices;
};

export const buyOutcomes = async buyList => {
  // load all outcome prices
  const { lmsr } = await loadConfig();
  const LMSR = await loadContract("LMSRMarketMaker", lmsr);
  // get market maker instance
  // console.log("buy: ", buyList)
  const cost = await LMSR.calcNetCost.call(buyList);
  // console.log("cost: ", cost.toString())

  const defaultAccount = await getDefaultAccount();
  const prev = new Decimal(await getAccountBalance());

  // get collateral
  const WETH = await loadContract("WETH9");
  await WETH.deposit({ value: cost, from: defaultAccount });
  await WETH.approve(LMSR.address, cost, { from: defaultAccount });

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
      return amount.toString();
    }

    return "0";
  });
  console.log({ sellList });

  // load all outcome prices
  const LMSR = await loadContract("LMSRMarketMaker", lmsr);
  const PMSystem = await loadContract("PredictionMarketSystem");

  // get market maker instance
  const cost = await LMSR.calcNetCost.call(sellList);
  console.log({ cost: cost.toString() });

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
  console.log(tx);
};
