import React, { useEffect } from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import Decimal from "decimal.js-light";
import Market from "./market";

const { BN } = Web3.utils;

const calcSelectedMarketProbabilitiesFromPositionProbabilities = (
  markets,
  marketSelections,
  positionProbabilities
) =>
  markets.map(({ outcomes }, i) =>
    marketSelections != null && marketSelections[i].isAssumed
      ? outcomes.map(
          (_, j) =>
            new Decimal(marketSelections[i].selectedOutcomeIndex === j ? 1 : 0)
        )
      : outcomes.map(({ positions }) =>
          positions.reduce(
            (acc, { positionIndex }) =>
              acc.add(positionProbabilities[positionIndex]),
            new Decimal(0)
          )
        )
  );

const Markets = ({
  markets,
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
  setMarketSelections: PropTypes.func.isRequired
};

export default Markets;
