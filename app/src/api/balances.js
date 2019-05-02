import {
  getDefaultAccount,
  getETHBalance,
  loadContract,
  loadConfig
} from "./web3";
import { generatePositionId, generatePositionIdList } from "./utils/positions";
import {
  nameMarketOutcomes,
  nameOutcomePairs,
  listAffectedMarketsForOutcomeIds
} from "./utils/probabilities";
import { lmsrCalcOutcomeTokenCount } from "./utils/lmsr";
import { resolvePositionGrouping } from "./utils/positionGrouping";
import Decimal from "decimal.js";

export const loadPositions = async () => {
  const { lmsr, markets, collateral: collateralAddress } = await loadConfig();

  // use position id generator
  const collateral = await loadContract("ERC20Detailed", collateralAddress);
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

  // filtering only for positions for which we hold balances
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

  // console.log(`position balances: ${JSON.stringify(balancesList)}`);

  return balancesList;
};

export const loadLmsrTokenBalances = async lmsr => {
  const PMSystem = await loadContract("PredictionMarketSystem");
  const positions = await loadPositions();

  return Promise.all(
    positions.map(async position => {
      const balance = (await PMSystem.balanceOf(lmsr, position))
        .abs()
        .toString();

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

  return stored_marketOutcomeCounts;
};

export const generatePositionList = async (markets, balances) => {
  const marketOutcomeCounts = await loadMarketOutcomeCounts();
  const outcomeIdNames = nameMarketOutcomes(marketOutcomeCounts);
  const outcomePairNames = nameOutcomePairs(outcomeIdNames);

  // extrapolate individual positions out of this information
  // e.g. Ay independent of all other outcomes is lowest amount in Ay****
  // AyBy independent of C* is lowest amount in AyBy**

  const positionGroupings = resolvePositionGrouping(
    outcomeIdNames,
    balances.map((balance, index) => [outcomePairNames[index], balance])
  );

  positionGroupings.sort(
    ([outcomeIds1, value1], [outcomeIds2, value2]) =>
      outcomeIds1.length - outcomeIds2.length || value2 - value1
  );

  return await Promise.all(
    positionGroupings.map(
      async ([outcomeIds, value, affectedAtomicOutcomes]) => {
        const affectedMarkets = listAffectedMarketsForOutcomeIds(
          markets,
          outcomeIds
        );

        return {
          outcomeIds,
          value,
          markets: affectedMarkets,
          outcomes: affectedAtomicOutcomes
        };
      }
    )
  );
};

export const loadAllowance = async () => {
  const { lmsr, collateral } = await loadConfig();

  const owner = await getDefaultAccount();
  const collateralContract = await loadContract("ERC20Detailed", collateral);

  return (await collateralContract.allowance(owner, lmsr)).toString();
};

export const setAllowanceInsanelyHigh = async () => {
  const { lmsr, collateral } = await loadConfig();

  const owner = await getDefaultAccount();
  const collateralContract = await loadContract("ERC20Detailed", collateral);

  await collateralContract.approve(lmsr, new Decimal(10).pow(19).toString(), {
    from: owner
  });

  return (await collateralContract.allowance(owner, lmsr)).toString();
};

export const calcProfitForSale = async sellAmounts => {
  const marketOutcomeCounts = await loadMarketOutcomeCounts();
  const outcomeIdNames = nameMarketOutcomes(marketOutcomeCounts);
  const outcomePairNames = nameOutcomePairs(outcomeIdNames);

  const simulatedSellAmounts = outcomePairNames.map(() => "0");

  sellAmounts.forEach(([atomicOutcome, amount]) => {
    const pairNameListIndex = outcomePairNames.indexOf(atomicOutcome);
    simulatedSellAmounts[pairNameListIndex] = `-${amount}`;
  });

  const { lmsr } = await loadConfig();
  const LMSR = await loadContract("LMSRMarketMaker", lmsr);

  return new Decimal(
    (await LMSR.calcNetCost.call(simulatedSellAmounts)).toString()
  ).neg();
};

export const getCollateralBalance = async () => {
  const { collateral } = await loadConfig();

  let collateralContract;
  let amount = new Decimal("0");
  try {
    collateralContract = await loadContract("WETH9", collateral);

    const ethBalance = await getETHBalance();
    amount = amount.add(ethBalance);
  } catch (err) {
    collateralContract = await loadContract("ERC20Detailed", collateral);
  }

  const owner = await getDefaultAccount();
  const collateralBalance = await collateralContract.balanceOf(owner);
  amount = amount.add(new Decimal(collateralBalance.toString()));

  return amount;
};

export const listOutcomePairsMatchingOutcomeId = async (
  outcomeIndexes,
  invert
) => {
  const marketOutcomeCounts = await loadMarketOutcomeCounts();
  const outcomeIdNames = nameMarketOutcomes(marketOutcomeCounts);
  const outcomePairNames = nameOutcomePairs(outcomeIdNames);

  if (invert) {
    // if it doesn't include any passed outcome ids
    return outcomePairNames.filter(pair =>
      outcomeIndexes.some(
        index => !pair.split(/&/g).includes(outcomeIdNames.flat()[index])
      )
    );
  }

  // if it includes all passed outcome ids
  return outcomePairNames.filter(pair =>
    outcomeIndexes.every(index =>
      pair.split(/&/g).includes(outcomeIdNames.flat()[index])
    )
  );
};

export const calcOutcomeTokenCounts = async (
  outcomePairs,
  assumedPairs,
  amount
) => {
  // console.log(outcomePairs)
  const { lmsr } = await loadConfig();

  const marketOutcomeCounts = await loadMarketOutcomeCounts();
  const outcomeIdNames = nameMarketOutcomes(marketOutcomeCounts);
  const outcomePairNames = nameOutcomePairs(outcomeIdNames);

  const LMSR = await loadContract("LMSRMarketMaker", lmsr);
  const funding = (await LMSR.funding()).toString();
  const lmsrTokenBalances = await loadLmsrTokenBalances(lmsr);

  // console.log("selected and assumed")
  // console.log(outcomePairs, assumedPairs)

  const assumedPairIndexes = assumedPairs.map(outcomePair =>
    outcomePairNames.indexOf(outcomePair)
  );
  const outcomePairsAsIndexes = outcomePairs.map(outcomePair =>
    outcomePairNames.indexOf(outcomePair)
  );

  // console.log(assumedPairIndexes, outcomePairsAsIndexes)
  const outcomeTokenCounts = await lmsrCalcOutcomeTokenCount(
    funding,
    lmsrTokenBalances,
    outcomePairsAsIndexes,
    amount,
    assumedPairIndexes
  );

  return outcomeTokenCounts;
};

export const tryToDepositCollateral = async (
  collateralAddress,
  targetAddress,
  amount
) => {
  const defaultAccount = await getDefaultAccount();

  const collateralContract = await loadContract("WETH9", collateralAddress);
  const balance = await collateralContract.balanceOf(defaultAccount);

  await collateralContract.deposit({
    value: new Decimal(amount.toString())
      .sub(new Decimal(balance.toString()))
      .toString(),
    from: defaultAccount
  });

  return collateralContract;
};
