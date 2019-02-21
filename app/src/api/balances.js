import web3 from "web3";

import { getDefaultAccount, loadContract, loadConfig } from "./web3";
import { generatePositionId, generatePositionIdList } from "./utils/positions";
import { nameMarketOutcomes, nameOutcomePairs, listAffectedMarketsForOutcomeIds } from "./utils/probabilities";
import { lmsrNetCost } from "./utils/lmsr";
import { resolvePositionGrouping } from "./utils/positionGrouping";
import Decimal from "decimal.js";

const { toBN, BN } = web3.utils;

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

export const lmsrTokenBalances = async lmsr => {
  const PMSystem = await loadContract("PredictionMarketSystem");
  const positions = await loadPositions();

  return Promise.all(
    positions.map(async position => {
      const balance = (await PMSystem.balanceOf(lmsr, position)).abs.toString();

      return balance;
    })
  );
};

let stored_marketOutcomeCounts;
export const loadMarketOutcomeCounts = async () => {
  if (!stored_marketOutcomeCounts) {
    const { markets } = await loadConfig();
    // load contracts
    const PMSystem = await loadContract("PredictionMarketSystem");

    stored_marketOutcomeCounts = await Promise.all(
      markets.map(async market =>
        (await PMSystem.getOutcomeSlotCount(market.conditionId)).toNumber()
      )
    );
  }

  return stored_marketOutcomeCounts
}

export const generatePositionList = async (balances) => {
  const marketOutcomeCounts = await loadMarketOutcomeCounts();
  const { markets, lmsr } = await loadConfig();
  const outcomeIdNames = nameMarketOutcomes(marketOutcomeCounts);
  const outcomePairNames = nameOutcomePairs(outcomeIdNames);

  const netCostCalculator = await lmsrNetCost(markets, lmsr);

  const outcomePrices = await Promise.all(
    balances.map(async (balance, index) => {
      if (+balance === 0) return 0
      const indexes = Array(balances.length).fill("0");
      indexes[index] = -balance;

      return (await netCostCalculator(indexes)).abs().toString();
    })
  );

  // extrapolate individual positions out of this information
  // e.g. Ay independent of all other outcomes is lowest amount in Ay****
  // AyBy independent of C* is lowest amount in AyBy**

  let positionGroupings = resolvePositionGrouping(outcomePrices.map((price, index) => [outcomePairNames[index], price]))
  console.log(positionGroupings)
  return await Promise.all(
    positionGroupings.map(async ([outcomeIds, value]) => {
      const affectedMarkets = listAffectedMarketsForOutcomeIds(markets, outcomeIds)

      return {
        outcomeIds,
        value,
        markets: affectedMarkets
      };
    })
  );
};

export const listAffectedOutcomesForIds = async (outcomeIds) => {
  const marketOutcomeCounts = await loadMarketOutcomeCounts();
  const outcomeIdNames = nameMarketOutcomes(marketOutcomeCounts);
  const outcomePairNames = nameOutcomePairs(outcomeIdNames);

  let outcomeIdArray = outcomeIds
  if (typeof outcomeIds === 'string') {
    outcomeIdArray = outcomeIds.split(/&/g)
  }

  return outcomePairNames.filter((outcomes) => outcomeIdArray.every((id) => outcomes.split(/&/g).includes(id)))
}

export const listOutcomeIdsForIndexes = async (outcomeIndexes) => {
  const marketOutcomeCounts = await loadMarketOutcomeCounts();
  const outcomeIdNames = nameMarketOutcomes(marketOutcomeCounts);
  const outcomePairNames = nameOutcomePairs(outcomeIdNames);

  return outcomePairNames.filter((pair) => outcomeIndexes.every((index) => pair.split(/&/g).includes(outcomeIdNames.flat()[index])))
}