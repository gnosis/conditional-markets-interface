import web3 from "web3";

import { getDefaultAccount, loadContract, loadConfig } from "./web3";
import { generatePositionId, generatePositionIdList } from "./utils/positions";
import { nameMarketOutcomes, nameOutcomePairs } from "./utils/probabilities";
import { lmsrNetCost } from "./utils/lmsr";
import Decimal from "decimal.js";

const { BN } = web3.utils;

export const loadPositions = async () => {
  const { lmsr, markets } = await loadConfig();
  // use position id generator
  const collateral = await loadContract("WETH9");
  const LMSR = await loadContract("LMSRMarketMaker", lmsr);
  const outcomeSlots = (await LMSR.atomicOutcomeSlotCount()).toNumber();

  // this generates a tree of position ids, resolving each step, to replicate the correct order
  const positionIdsForOrder = generatePositionIdList(markets, collateral);

  // this generates a list of all end-position ids
  const positionIdsUnordered = [];
  Object.keys(Array(outcomeSlots).fill()).forEach(outcomeIndex => {
    positionIdsUnordered.push(
      generatePositionId(markets, collateral, outcomeIndex)
    );
  });

  // filtering the ordered list, we can create an ordered list of only the end-position ids, because positionIdsUnordered is a subset of positionIdsForOrder
  return positionIdsForOrder.filter(
    id => positionIdsUnordered.indexOf(id) > -1
  );
};

export const loadBalances = async positions => {
  const owner = await getDefaultAccount();
  const { markets } = await loadConfig();
  const PMSystem = await loadContract("PredictionMarketSystem");

  // get position balances
  const balances = {};
  const balancesList = [];
  await Promise.all(
    positions.map(async positionId => {
      balances[positionId] = (await PMSystem.balanceOf(
        owner,
        positionId
      )).toString();
      balancesList.push(balances[positionId]);
    })
  );

  console.log(`position balances: ${JSON.stringify(balancesList)}`);

  return balancesList;
};

let marketOutcomeCounts;
export const generatePositionList = async (balances, marketOutcomeCounts) => {
  const { markets, lmsr } = await loadConfig();
  if (!marketOutcomeCounts) {
    // load contracts
    const PMSystem = await loadContract("PredictionMarketSystem");

    marketOutcomeCounts = await Promise.all(
      markets.map(async market =>
        (await PMSystem.getOutcomeSlotCount(market.conditionId)).toNumber()
      )
    );
  }

  const outcomeIdNames = nameMarketOutcomes(marketOutcomeCounts);
  const outcomePairNames = nameOutcomePairs(outcomeIdNames);

  const netCostCalculator = await lmsrNetCost(markets, lmsr);

  console.log(
    balances.map(
      (balance, index) => `${outcomePairNames.flat()[index]}: ${balance}`
    )
  );

  return await Promise.all(
    balances.map(async (balance, index) => {
      // simulate "sell"
      const indexes = Array(balances.length).fill("0");
      indexes[index] = -balance;
      const cost = await netCostCalculator(indexes);
      console.log(cost);
      return `${outcomePairNames[index]} -> ${balance} Shares`;
    })
  );
};
