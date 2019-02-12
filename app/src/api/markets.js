import web3 from "web3";

import { getDefaultAccount, loadContract, loadConfig } from "./web3";
import { generatePositionId } from "./utils/positions";
import { retrieveBalances } from "./balances";
import {
  getIndividualProbabilities,
  resolvePartitionSets,
  getAssumedProbabilities
} from "./utils/probabilities";

const { BN } = web3.utils;

const OUTCOME_COLORS = [
  "#fbb4ae",
  "#b3cde3",
  "#ccebc5",
  "#decbe4",
  "#fed9a6",
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
export const loadMarkets = async (assumptions = {}) => {
  // load hardcoded market entries from config
  const { markets, lmsr } = await loadConfig();

  // load contracts
  const PMSystem = await loadContract("PredictionMarketSystem");
  const WETH = await loadContract("WETH9");
  const LMSR = await loadContract("LMSRMarketMaker", lmsr);
  const owner = await getDefaultAccount();

  // load all balances
  const balances = await retrieveBalances(PMSystem, LMSR, markets);
  console.log(balances);
  // load all outcome prices
  const outcomeSlotCount = (await LMSR.atomicOutcomeSlotCount()).toNumber();
  const outcomePrices = await Promise.all(
    Array(outcomeSlotCount)
      .fill()
      .map(async (_, index) => await LMSR.calcMarginalPrice(index))
  );

  const outcomesInMarkets = markets.map(async market =>
    (await PMSystem.getOutcomeSlotCount(market.conditionId)).toNumber()
  );

  const marginalPricesPerMarket = {};

  let totalOutcomeIndex = 0;
  markets.forEach((market, marketIndex) => {
    const outcomesInMarket = outcomesInMarkets[marketIndex];
    console.log(market);

    let marketOutcomeIndex = 0;

    let marketOutcomePrices = Array(outcomesInMarket).fill(new BN(0));
    while (marketOutcomeIndex < outcomesInMarket) {
      if (!marginalPricesPerMarket[market.conditionId]) {
        marginalPricesPerMarket[market.conditionId] = new BN(0);
      }

      const outcomePrice = outcomePrices[totalOutcomeIndex];
      marketOutcomePrices[marketIndex] = outcomePrice;
      marginalPricesPerMarket[market.conditionId] = marginalPricesPerMarket[
        market.conditionId
      ].add(outcomePrice);

      totalOutcomeIndex++;
      marketOutcomeIndex++;
    }
  });

  // reset lmsr outcome index counter
  let lmsrOutcomeIndex = 0;
  const transformedAssumptions = [];

  const marketsTransformed = await Promise.all(
    markets.map(async (market, marketIndex) => {
      // outcome transformation, loading contract data
      const outcomes = await Promise.all(
        market.outcomes.map((title, outcomeIndex) => {
          const positionId = generatePositionId(
            markets,
            WETH,
            lmsrOutcomeIndex
          );

          const balance = balances[marketIndex][outcomeIndex];

          const outcomePrice = outcomePrices[lmsrOutcomeIndex];

          const outcome = {
            name: title,
            positionId,
            lmsrOutcomeIndex: lmsrOutcomeIndex,
            color: OUTCOME_COLORS[lmsrOutcomeIndex],
            price: outcomePrice.toString(),
            balance
          };

          lmsrOutcomeIndex++;

          return outcome;
        })
      );

      const originalValue = assumptions[market.conditionId];

      if (typeof originalValue !== "undefined") {
        transformedAssumptions[marketIndex] = parseInt(originalValue, 10);
      }

      return {
        ...market,
        outcomes
      };
    })
  );

  const marketPrices = marketsTransformed.map(market =>
    market.outcomes.map(outcome => outcome.price)
  );
  const individualProbabilities = getIndividualProbabilities(marketPrices);
  const assumedProbabilities = getAssumedProbabilities(marketPrices, transformedAssumptions);

  console.log(
    JSON.stringify(
      {
        individualProbabilities,
        assumedProbabilities
      },
      null,
      2
    )
  );

  // apply probabilities
  const usedProbabilities =
    transformedAssumptions.length > 0 ? assumedProbabilities : individualProbabilities;
  usedProbabilities.forEach((marketsProbabilities, marketIndex) => {
    marketsProbabilities.forEach((probability, probabilityIndex) => {
      marketsTransformed[marketIndex].outcomes[
        probabilityIndex
      ].probability = probability;
    });
  });

  return marketsTransformed;
};

export const buyOutcomes = async (lmsrOutcomeIndexes, amount) => {
  // load all outcome prices
  const { lmsr } = await loadConfig();
  const LMSR = await loadContract("LMSRMarketMaker", lmsr);

  let conditionIds = [];
  let conditionIdIndex = 0;
  while (conditionIdIndex < 256) {
    try {
      const conditionId = await LMSR.conditionIds(conditionIdIndex);
      conditionIds.push(conditionId.toString());
      conditionIdIndex++;
    } catch (err) {
      break;
    }
  }

  const outcomeSlotCount = (await LMSR.atomicOutcomeSlotCount()).toNumber();

  const PMSystem = await loadContract("PredictionMarketSystem");

  // as we're not buying outcome indexes but specific outcome-sets, we need to resolve the indexes to outcome sets
  const marketStructure = await Promise.all(
    conditionIds.map(async marketConditionId => {
      const amountOfOutcomes = (await PMSystem.getOutcomeSlotCount(
        marketConditionId
      )).toNumber();
      return Array(amountOfOutcomes).fill(0);
    })
  );

  //const marketStructure = Array(outcomeSlotCount)
  const { outcomePairs, outcomeIds } = resolvePartitionSets(marketStructure);

  // list of outcomePairIndexes we'd like to aquire
  const wantList = lmsrOutcomeIndexes.map(
    outcomeIndex => outcomeIds.flat()[outcomeIndex]
  );

  const shareAmountToBuy = new BN(amount);
  const buyList = Array(outcomeSlotCount)
    .fill()
    .map((_, index) => {
      const outcomePair = outcomePairs.flat()[index];

      const outcomesInPair = outcomePair.split("&");
      const pairHasAllWantedOutcomes = wantList.every(
        id => outcomesInPair.indexOf(id) > -1
      );

      return pairHasAllWantedOutcomes
        ? shareAmountToBuy.toString()
        : SHARE_AMOUNT_NONE.toString();
    });

  console.log(`buying "${JSON.stringify(wantList)}" with ${amount} each.`);
  console.log(`assembled "buyList": "${JSON.stringify(buyList)}"`);

  // get market maker instance
  const cost = await LMSR.calcNetCost.call(buyList);
  console.log({ cost });

  const defaultAccount = await getDefaultAccount();

  // get collateral
  const WETH = await loadContract("WETH9");
  await WETH.deposit({ value: cost, from: defaultAccount });
  await WETH.approve(LMSR.address, cost, { from: defaultAccount });

  // run trade
  const tx = await LMSR.trade(buyList, cost, { from: defaultAccount });
  console.log(tx);
};

export const sellOutcomes = async (lmsrOutcomeIndexes, amount) => {
  console.log("TCL: sellOutcomes -> lmsrOutcomeIndexes", lmsrOutcomeIndexes);

  // load all outcome prices
  const { lmsr } = await loadConfig();
  const LMSR = await loadContract("LMSRMarketMaker", lmsr);
  const PMSystem = await loadContract("PredictionMarketSystem");

  let conditionIds = [];
  let conditionIdIndex = 0;
  while (conditionIdIndex < 256) {
    try {
      const conditionId = await LMSR.conditionIds(conditionIdIndex);
      conditionIds.push(conditionId.toString());
      conditionIdIndex++;
    } catch (err) {
      break;
    }
  }

  const outcomeSlotCount = (await LMSR.atomicOutcomeSlotCount()).toNumber();

  // as we're not selling outcome indexes but specific outcome-sets, we need to resolve the indexes to outcome sets
  const marketStructure = await Promise.all(
    conditionIds.map(async marketConditionId => {
      const amountOfOutcomes = (await PMSystem.getOutcomeSlotCount(
        marketConditionId
      )).toNumber();
      return Array(amountOfOutcomes).fill(0);
    })
  );

  //const marketStructure = Array(outcomeSlotCount)
  const { outcomePairs, outcomeIds } = resolvePartitionSets(marketStructure);
  console.log("TCL: sellOutcomes -> outcomePairs", outcomePairs);

  // list of outcomePairIndexes we'd like to sell
  const wantList = lmsrOutcomeIndexes.map(
    outcomeIndex => outcomeIds.flat()[outcomeIndex]
  );

  const sellList = Array(outcomeSlotCount)
    .fill()
    .map((_, index) => {
      const outcomePair = outcomePairs.flat()[index];

      const outcomesInPair = outcomePair.split("&");
      const pairHasAllWantedOutcomes = wantList.every(
        id => outcomesInPair.indexOf(id) > -1
      );

      return pairHasAllWantedOutcomes ? -amount : SHARE_AMOUNT_NONE.toString();
    });

  console.log(`selling "${JSON.stringify(wantList)}" with ${amount} each.`);
  console.log(`assembled "sellList": "${JSON.stringify(sellList)}"`);

  const testSellList = [-1, "0", 0, "0"];

  // get market maker instance
  const cost = await LMSR.calcNetCost.call(testSellList);
  console.log({ cost: cost.toString() });

  const defaultAccount = await getDefaultAccount();

  // set approval
  await PMSystem.setApprovalForAll(lmsr, true, {
    from: defaultAccount
  });
  console.log("approval set");
  // run trade
  const tx = await LMSR.trade(testSellList, cost, {
    from: defaultAccount,
    gas: 0x6691b7
  });
  console.log(tx);
};
