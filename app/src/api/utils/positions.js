import web3 from "web3";
import { asAddress, asBytes32, addWithOverflow } from "../../utils/solidity";
const { BN, soliditySha3 } = web3.utils;

function* positionListGenerator(markets, parentCollectionId) {
  if (!markets.length) return;
  const newMarkets = [...markets];
  const market = newMarkets.pop();

  for (
    let outcomeIndex = 0;
    outcomeIndex < market.outcomes.length;
    outcomeIndex++
  ) {
    const marketCollectionId = new BN(
      soliditySha3(
        {
          t: "bytes32",
          v: asBytes32(market.conditionId)
        },
        {
          t: "bytes32",
          v: asBytes32(1 << outcomeIndex)
        }
      ).slice(2),
      16
    );

    const collectionId = addWithOverflow(
      parentCollectionId,
      marketCollectionId
    );

    yield collectionId.toString(16);
    yield* positionListGenerator(newMarkets, collectionId);
  }
}

function* collectionIdGeneratorForRedeem(
  markets,
  parentCollectionId,
  targetDepth,
  targetOutcomes
) {
  if (!markets.length) return;
  const newMarkets = [...markets];
  const market = newMarkets.pop();

  for (
    let outcomeIndex = 0;
    outcomeIndex < market.outcomes.length;
    outcomeIndex++
  ) {
    const marketCollectionId = new BN(
      soliditySha3(
        {
          t: "bytes32",
          v: asBytes32(market.conditionId)
        },
        {
          t: "bytes32",
          v: asBytes32(1 << outcomeIndex)
        }
      ).slice(2),
      16
    );

    const collectionId = addWithOverflow(
      parentCollectionId,
      marketCollectionId
    );
    // used to generate a debug-tree of all position id steps
    yield collectionId.toString(16);
    yield* collectionIdGeneratorForRedeem(
      newMarkets,
      collectionId,
      targetDepth,
      targetOutcomes
    );
  }
}

export const generateCollectionIdList = markets => {
  const gen = positionListGenerator(markets, new BN(0));
  const positionIds = [];

  let res = gen.next();
  while (!res.done) {
    positionIds.push(res.value);
    res = gen.next();
  }
  return positionIds;
};

export const generatePositionIdList = (markets, collateral) => {
  const collectionIds = generateCollectionIdList(markets);

  return collectionIds.map(collectionId => {
    return soliditySha3(
      { t: "address", v: asAddress(collateral.address) },
      { t: "bytes32", v: asBytes32(collectionId) }
    );
  });
};

export const findCollectionIdsForConditionsAndSelections = markets => {
  const targetOutcomes = markets.map(
    market => market.outcomes[market.selectedOutcome].lmsrIndex
  );
  // format from collectionIdGeneratorForRedeem is [collectionId, lmsrIndexOfTargetOutcome]
  const targetCollectionIds = [
    ...collectionIdGeneratorForRedeem(markets, new BN(0), 0, targetOutcomes)
  ];
  targetCollectionIds.push([0, undefined]);

  return targetCollectionIds;
};

/**
 * Generates atomic Position-IDs according to smart contract implementation
 *
 * @param {[Market]} markets - Array of Markets, must contain atleast `conditionId`
 * @param {TruffleContract|Object} collateral - TruffleContract instance or object containing `address`
 * @param {number} outcomeIndex - Outcome Index of the Position-ID to be generated
 */
export const generatePositionId = (markets, collateral, outcomeIndex) => {
  let collectionId = new BN(0);
  markets.forEach(market => {
    const anotherCollectionId = new BN(
      soliditySha3(
        {
          t: "bytes32",
          v: asBytes32(market.conditionId)
        },
        {
          t: "bytes32",
          v: asBytes32(1 << outcomeIndex % market.outcomes.length)
        }
      ).slice(2),
      16
    );

    // needed to replicate the behaviour in the smart contract
    collectionId = addWithOverflow(collectionId, anotherCollectionId);

    outcomeIndex = Math.floor(outcomeIndex / market.outcomes.length);
  });

  return soliditySha3(
    { t: "address", v: asAddress(collateral.address) },
    { t: "bytes32", v: asBytes32(collectionId) }
  );
};
