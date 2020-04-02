import { product } from "utils/itertools";
import { toBN } from "utils/web3";
import {
  getCollectionId,
  getPositionId,
  combineCollectionIds
} from "utils/getIdsUtil";

import { getMarketMakers } from "api/operator";

export async function loadMarketsData({ lmsrAddress }) {
  // query operator for market maker information
  return getMarketMakers({ lmsrAddress }).then(({ results }) => {
    // If no results or more than 1 market maker matching
    if (results.length !== 1) {
      throw new Error(
        `Unexpected result for market maker address ${lmsrAddress}`
      );
    }

    const { questions, funding, collateralToken } = results[0];
    const markets = questions.map((market, i) => {
      const { conditionId, outcomeSlotCount: numSlots } = market;

      market.marketIndex = i;
      market.outcomes = market.outcomeNames.map((outcome, i) => {
        const collectionId = getCollectionId(conditionId, toBN(1).shln(i));
        return {
          title: outcome,
          short: outcome,
          positions: [],
          collectionId
        };
      });

      if (numSlots === 0) {
        throw new Error(`condition ${conditionId} not set up yet`);
      } else if (market.type === "SCALAR") {
        if (numSlots !== 2) {
          throw new Error(
            `condition ${conditionId} outcome slot not valid for scalar market - requires long and short outcomes`
          );
        }

        // set outcomes to enable calculations on outcome count
        market.outcomes[0].title = "short";
        market.outcomes[1].title = "long";
      } else if (numSlots !== market.outcomeNames.length) {
        throw new Error(
          `condition ${conditionId} outcome slot count ${numSlots} does not match market outcome descriptions array with length ${market.outcomeNames.length}`
        );
      }

      return market;
    });

    const positions = [];
    for (const outcomes of product(
      ...markets
        .slice()
        .reverse()
        .map(({ conditionId, outcomes, marketIndex }) =>
          outcomes.map((outcome, outcomeIndex) => ({
            ...outcome,
            conditionId,
            marketIndex,
            outcomeIndex
          }))
        )
    )) {
      const combinedCollectionIds = combineCollectionIds(
        outcomes.map(({ collectionId }) => collectionId)
      );

      const positionId = getPositionId(collateralToken, combinedCollectionIds);
      positions.push({
        id: positionId,
        outcomes,
        positionIndex: positions.length
      });
    }

    for (const position of positions) {
      for (const outcome of position.outcomes) {
        markets[outcome.marketIndex].outcomes[
          outcome.outcomeIndex
        ].positions.push(position);
      }
    }

    return { markets, positions, collateralToken, funding };
  });
}
