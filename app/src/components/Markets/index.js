import React from "react";
import PropTypes from "prop-types";
import Market from "../Market";

const Markets = ({
  markets,
  assumptions,
  selectedOutcomes,

  predictionProbabilities,

  handleSelectAssumption,
  handleSelectOutcome
}) => (
  <div>
    {markets.map((market, index) => (
      <Market
        key={market.conditionId}
        {...market}
        assumed={assumptions.indexOf(market.conditionId) > -1}
        disabled={!!assumptions[market.conditionId]}
        selectedOutcome={selectedOutcomes[market.conditionId]}
        predictionProbabilities={predictionProbabilities}
        marketIndex={index}
        handleSelectOutcome={handleSelectOutcome}
        handleSelectAssumption={handleSelectAssumption}
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

  predictionProbabilities: PropTypes.any.isRequired,

  handleSelectAssumption: PropTypes.any.isRequired,
  handleSelectOutcome: PropTypes.any.isRequired
};

export default Markets;
