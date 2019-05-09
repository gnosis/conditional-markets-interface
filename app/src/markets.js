import React, { useEffect } from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import Decimal from "decimal.js-light";
import Market from "./market";

const { BN } = Web3.utils;

function calcSelectedMarketProbabilitiesFromPositionProbabilities(
  markets,
  allPositions,
  marketSelections,
  positionProbabilities
) {
  const sumConsideredPositionProbabilities = whichPositions =>
    whichPositions
      .filter(({ outcomes }) =>
        outcomes.every(
          ({ marketIndex, outcomeIndex }) =>
            !marketSelections[marketIndex].isAssumed ||
            outcomeIndex === marketSelections[marketIndex].selectedOutcomeIndex
        )
      )
      .reduce(
        (acc, { positionIndex }) =>
          acc.add(positionProbabilities[positionIndex]),
        new Decimal(0)
      );

  const allConsideredPositionsProbability = sumConsideredPositionProbabilities(
    allPositions
  );
  return markets.map(({ outcomes }, i) =>
    marketSelections != null && marketSelections[i].isAssumed
      ? outcomes.map(
          (_, j) =>
            new Decimal(marketSelections[i].selectedOutcomeIndex === j ? 1 : 0)
        )
      : outcomes.map(({ positions }) =>
          sumConsideredPositionProbabilities(positions).div(
            allConsideredPositionsProbability
          )
        )
  );
}

const Markets = ({
  markets,
  marketResolutionStates,
  positions,
  lmsrState,
  marketSelections,
  setMarketSelections,
  stagedTradeAmounts
}) => {
  useEffect(() => {
    setMarketSelections(
      Array.from({ length: markets.length }, () => ({
        selectedOutcomeIndex: null,
        isAssumed: false
      }))
    );
    return () => {
      setMarketSelections(null);
    };
  }, []);

  let marketProbabilities = null;
  let marketProbabilitiesAfterStagedTrade = null;
  if (lmsrState != null) {
    const { funding, positionBalances } = lmsrState;
    const invB = new Decimal(positionBalances.length)
      .ln()
      .div(funding.toString());

    const positionProbabilities = positionBalances.map(balance =>
      invB
        .mul(balance.toString())
        .neg()
        .exp()
    );
    marketProbabilities = calcSelectedMarketProbabilitiesFromPositionProbabilities(
      markets,
      positions,
      marketSelections,
      positionProbabilities
    );

    if (stagedTradeAmounts != null) {
      const unnormalizedPositionProbabilitiesAfterStagedTrade = positionProbabilities.map(
        (probability, i) =>
          probability.mul(stagedTradeAmounts[i].mul(invB).exp())
      );
      const normalizer = new Decimal(1).div(
        unnormalizedPositionProbabilitiesAfterStagedTrade.reduce((a, b) =>
          a.add(b)
        )
      );
      const positionProbabilitiesAfterStagedTrade = unnormalizedPositionProbabilitiesAfterStagedTrade.map(
        probability => probability.mul(normalizer)
      );

      marketProbabilitiesAfterStagedTrade = calcSelectedMarketProbabilitiesFromPositionProbabilities(
        markets,
        positions,
        marketSelections,
        positionProbabilitiesAfterStagedTrade
      );
    }
  }

  return (
    <div>
      {markets.map((market, i) => (
        <Market
          key={market.conditionId}
          {...{
            ...market,
            lmsrState,
            resolutionState:
              marketResolutionStates != null ? marketResolutionStates[i] : null,
            probabilities:
              marketProbabilities != null ? marketProbabilities[i] : null,
            stagedProbabilities:
              marketProbabilitiesAfterStagedTrade != null
                ? marketProbabilitiesAfterStagedTrade[i]
                : null,
            marketSelection:
              marketSelections != null ? marketSelections[i] : null,
            setMarketSelection(marketSelection) {
              setMarketSelections(
                marketSelections.map((originalMarketSelection, j) =>
                  i === j ? marketSelection : originalMarketSelection
                )
              );
            }
          }}
        />
      ))}
    </div>
  );
};

Markets.propTypes = {
  markets: PropTypes.arrayOf(
    PropTypes.shape({
      conditionId: PropTypes.string.isRequired
    }).isRequired
  ).isRequired,
  marketResolutionStates: PropTypes.array,
  positions: PropTypes.arrayOf(
    PropTypes.shape({
      positionIndex: PropTypes.number.isRequired,
      outcomes: PropTypes.arrayOf(
        PropTypes.shape({
          marketIndex: PropTypes.number.isRequired,
          outcomeIndex: PropTypes.number.isRequired
        }).isRequired
      ).isRequired
    }).isRequired
  ).isRequired,
  lmsrState: PropTypes.shape({
    funding: PropTypes.instanceOf(BN).isRequired,
    positionBalances: PropTypes.arrayOf(PropTypes.instanceOf(BN).isRequired)
      .isRequired
  }),
  marketSelections: PropTypes.arrayOf(
    PropTypes.shape({
      selectedOutcomeIndex: PropTypes.number,
      isAssumed: PropTypes.bool.isRequired
    }).isRequired
  ),
  setMarketSelections: PropTypes.func.isRequired,
  stagedTradeAmounts: PropTypes.arrayOf(
    PropTypes.instanceOf(Decimal).isRequired
  )
};

export default Markets;
