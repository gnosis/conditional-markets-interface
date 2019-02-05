import web3 from "web3";

import { getDefaultAccount, loadContract, loadConfig } from "./web3";
import { generatePositionId } from "./utils/positions";
import { retrieveBalances } from "./balances";

const colors = [
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

const { BN } = web3.utils;

/**
 * Fetches markets, transforms them, adds data from smart contracts and returns them.
 *
 * @param {*} assumedOutcomes Simulate prices, costs and probabilities with given outcomes
 */
export const loadMarkets = async () => {
  // load hardcoded market entries from config
  const { markets, lmsr } = await loadConfig();

  // load contracts
  const PMSystem = await loadContract("PredictionMarketSystem");
  const WETH = await loadContract("WETH9");
  const LMSR = await loadContract("LMSRMarketMaker", lmsr);
  const owner = await getDefaultAccount();

  // load all balances
  const balances = await retrieveBalances(PMSystem, markets);

  // load all outcome prices
  const outcomeSlotCount = (await LMSR.atomicOutcomeSlotCount()).toNumber();
  const outcomePrices = await Promise.all(
    Array(outcomeSlotCount)
      .fill()
      .map(async (_, index) => await LMSR.calcMarginalPrice(index))
  );

  const marginalPricesPerMarket = {};

  let marketIndex = 0;
  let totalOutcomeIndex = 0;
  while (totalOutcomeIndex < outcomeSlotCount) {
    const market = markets[marketIndex];
    const outcomesInMarket = (await PMSystem.getOutcomeSlotCount(
      market.conditionId
    )).toNumber();

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

    marketIndex++;
  }

  // reset lmsr outcome index counter
  let lmsrOutcomeIndex = 0;

  const marketsTransformed = await Promise.all(
    markets.map(async market => {
      // outcome transformation, loading contract data
      const outcomes = await Promise.all(market.outcomes.map((title) => {
        const positionId = generatePositionId(markets, WETH, lmsrOutcomeIndex)

        const balance = balances[positionId]
        const outcomePrice = outcomePrices[lmsrOutcomeIndex]
        
        const outcome = {
          name: title,
          positionId,
          lmsrOutcomeIndex: lmsrOutcomeIndex,
          color: colors[lmsrOutcomeIndex],
          price: outcomePrice.toString(),
          balance,
        }
        
        lmsrOutcomeIndex++

        return outcome
      }))

      return {
        ...market,
        outcomes
      };
    })
  );

  const probabilities = resolveProbabilities(
    marketsTransformed.map((market) => market.outcomes.map((outcome) => outcome.price)),
    [0]
  )

  // apply probabilities
  probabilities.forEach((marketsProbabilities, marketIndex) => {
    marketsProbabilities.forEach((probability, probabilityIndex) => {
      marketsTransformed[marketIndex].outcomes[probabilityIndex].probability = probability
    })
  })

  return marketsTransformed
}

export const buyOutcomes = async (lmsrOutcomeIndexes, amount) => {
  const howManyOutcomesOfEachToBuy = amount / lmsrOutcomeIndexes.length;

  // load all outcome prices
  const { lmsr } = await loadConfig();
  const LMSR = await loadContract("LMSRMarketMaker", lmsr);
  const outcomeSlotCount = (await LMSR.atomicOutcomeSlotCount()).toNumber();

  const buyList = Array(outcomeSlotCount)
    .fill()
    .map((_, position) => {
      if (lmsrOutcomeIndexes.indexOf(position) > -1) {
        return howManyOutcomesOfEachToBuy;
      }

      return new BN(0);
    });

  console.log(buyList.map(n => n.toString()));

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
  const howManyOutcomesOfEachToSell = amount / lmsrOutcomeIndexes.length;

  // load all outcome prices
  const { lmsr } = await loadConfig();
  const LMSR = await loadContract("LMSRMarketMaker", lmsr);
  const PMSystem = await loadContract("PredictionMarketSystem");

  const outcomeSlotCount = (await LMSR.atomicOutcomeSlotCount()).toNumber();

  const sellList = Array(outcomeSlotCount)
    .fill()
    .map((_, position) => {
      if (lmsrOutcomeIndexes.indexOf(position) > -1) {
        return -howManyOutcomesOfEachToSell;
      }

      return new BN(0);
    });

  console.log(sellList.map(n => n.toString()));

  // get market maker instance
  const cost = await LMSR.calcNetCost.call(sellList);
  console.log({ cost });

  const defaultAccount = await getDefaultAccount();

  // set approval
  await PMSystem.setApprovalForAll(lmsr, true, {
    from: defaultAccount
  });

  // run trade
  const tx = await LMSR.trade(sellList, cost, { from: defaultAccount });
  console.log(tx);
};
