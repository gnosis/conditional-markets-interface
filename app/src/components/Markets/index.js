import React from "react";
import PropTypes from "prop-types";
import Market from "../Market";

const Markets = ({
  markets,
  assumptions,
  selectedOutcomes,
  handleSelectOutcome,
  handleSellOutcome,
  handleSelectAssumption,
  handleBuyOutcomes,
  sellAmounts,
  predictionProbabilities
}) => (
  <div>
    {markets.map((market, index) => (
      <Market
        key={market.conditionId}
        {...market}
        marketIndex={index}
        assumed={assumptions.indexOf(market.conditionId) > -1}
        handleSelectOutcome={handleSelectOutcome}
        selectedOutcome={selectedOutcomes[market.conditionId]}
        disabled={!!assumptions[market.conditionId]}
        sellAmounts={sellAmounts}
        handleSellOutcome={handleSellOutcome}
        handleSelectAssumption={handleSelectAssumption}
        handleBuyOutcomes={handleBuyOutcomes}
        predictionProbabilities={predictionProbabilities}
      />
    ))}
  </div>
);

Markets.propTypes = {
  markets: PropTypes.arrayOf(
    PropTypes.shape({
      conditionId: PropTypes.string.isRequired
    }).isRequired
  ).isRequired,
  assumptions: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  selectedOutcomes: PropTypes.object.isRequired,
  handleSelectOutcome: PropTypes.any.isRequired,
  handleSellOutcome: PropTypes.any,
  handleSelectAssumption: PropTypes.any.isRequired,
  handleBuyOutcomes: PropTypes.any,
  sellAmounts: PropTypes.any,
  predictionProbabilities: PropTypes.any.isRequired
};

export default Markets;
