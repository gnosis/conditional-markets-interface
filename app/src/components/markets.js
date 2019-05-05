import React, { useEffect } from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import Decimal from "decimal.js-light";
import Market from "./market";

const { BN } = Web3.utils;

function calcMarginalPrices(lmsrState) {
  const { funding, positionBalances } = lmsrState;
  const invB = new Decimal(positionBalances.length)
    .ln()
    .div(funding.toString());

  return positionBalances.map(balance =>
    invB
      .mul(balance.toString())
      .neg()
      .exp()
  );
}

const Markets = ({
  markets,
  lmsrState,
  marketSelections,
  setMarketSelections
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
  if (lmsrState != null) {
    const positionProbabilities = calcMarginalPrices(lmsrState);
    marketProbabilities = markets.map(({ outcomes }, i) =>
      marketSelections != null && marketSelections[i].isAssumed
        ? outcomes.map(
            (_, j) =>
              new Decimal(
                marketSelections[i].selectedOutcomeIndex === j ? 1 : 0
              )
          )
        : outcomes.map(({ positions }) =>
            positions.reduce(
              (acc, { positionIndex }) =>
                acc.add(positionProbabilities[positionIndex]),
              new Decimal(0)
            )
          )
    );
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
