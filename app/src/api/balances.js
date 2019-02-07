import web3 from 'web3'

import { getDefaultAccount, loadContract } from "./web3";
import { generatePositionId } from "./utils/positions";
import { resolvePartitionSets } from "./utils/probabilities"

const { toBN, BN } = web3.utils

export const retrieveBalances = async (pmsystem, lmsr, markets, _positionIds) => {
  const owner = await getDefaultAccount();

  let positionIds = _positionIds;
  if (!Array.isArray(positionIds)) {
    // use position id generator
    const collateral = await loadContract("WETH9");


    let lmsrOutcomeIndex = 0;
    positionIds = [];

    const outcomeSlots = (await lmsr.atomicOutcomeSlotCount()).toNumber();
    
    Array(outcomeSlots)
      .fill()
      .forEach(() => {
        //console.log(i)
        positionIds.push(
          generatePositionId(markets, collateral, lmsrOutcomeIndex)
        );
        lmsrOutcomeIndex++;
      });
  
  }

  // get position balances
  const balances = {};
  const balancesList = []
  await Promise.all(
    positionIds.map(async positionId => {
      balances[positionId] = (await pmsystem.balanceOf(
        owner,
        positionId
      )).toString();
      balancesList.push(balances[positionId])
    })
  );

  console.log(`position balances: ${JSON.stringify(balancesList)}`)

  // map balances to outcome positions

  // create an empty market structure like [[0, 0, 0], [0, 0, 0]] to map position combinations
  const marketStructure = markets.map((market) => market.outcomes.map(() => 0))
  const { outcomeIds, outcomePairs } = resolvePartitionSets(marketStructure)

  const outcomeBalances = marketStructure.map((marketOutcomePrices) => marketOutcomePrices.map(() => new BN(0)))

  // loop through positionIds, matching their corresponding outcomeIndexes to outcomePairs
  // and then suming them the corresponding outcomeIds
  
  positionIds.forEach((positionId, outcomeIndex) => {
    const outcomePair = outcomePairs.flat()[outcomeIndex]

    //console.log(`finding balance for ${outcomePair}`)

    outcomeBalances.forEach((marketOutcomePrices, outcomeGroupIndex) => {
      marketOutcomePrices.forEach((_, priceIndex) => {
        const outcomeId = outcomeIds[outcomeGroupIndex][priceIndex]
        
        if (outcomePair.indexOf(outcomeId) > -1) {
          //console.log(`"${outcomePair}": ${balances[positionId]} summed to "${outcomeId}"s balance`)
          const amount = new BN(balances[positionId])
          outcomeBalances[outcomeGroupIndex][priceIndex] = 
            outcomeBalances[outcomeGroupIndex][priceIndex].add(amount)
        }
      })
    })
  })
  console.log("balances", JSON.stringify(outcomeBalances.map((g) => g.map(n => n.toString()))))

  return outcomeBalances;
};
