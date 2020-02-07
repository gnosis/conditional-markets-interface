import React, { useMemo } from "react";
import PropTypes from "prop-types";

import prepareTradesData from "utils/prepareTradesData";

import Graph from "components/Graph";

const probabilityChart = ({
  lowerBound,
  upperBound,
  decimals,
  unit,
  marketType,
  created,
  probabilities,
  resolutionDate,
  resolutionValue,
  stagedProbabilities,
  tradeHistory
}) => {
  const parsedTrades = useMemo(() => {
    if (tradeHistory) {
      return prepareTradesData(
        { lowerBound, upperBound, type: marketType },
        tradeHistory
      );
    } else return [];
  }, [marketType, tradeHistory]);

  const getValueFromBounds = value => {
    // Value is a percentage of outcome tokens, should get the value
    // that it represents compared with bounds.
    // For categorical markets this is a normal percentage.
    return value
      .mul(upperBound - lowerBound)
      .add(lowerBound)
      .toNumber();
  };
  const displayedProbabilities = useMemo(() => {
    if (stagedProbabilities) {
      return marketType === "CATEGORICAL"
        ? stagedProbabilities.map(getValueFromBounds)
        : [getValueFromBounds(stagedProbabilities[1])];
    } else {
      return marketType === "CATEGORICAL"
        ? probabilities.map(getValueFromBounds)
        : [getValueFromBounds(probabilities[1])];
    }
  }, [probabilities, stagedProbabilities]);

  return (
    <Graph
      lowerBound={lowerBound}
      upperBound={upperBound}
      decimals={decimals}
      unit={unit}
      entries={parsedTrades}
      resolutionDate={resolutionDate}
      resolutionValue={resolutionValue}
      currentProbability={displayedProbabilities}
      marketType={marketType}
      created={created}
    ></Graph>
  );
};

probabilityChart.propTypes = {
  lowerBound: PropTypes.string.isRequired,
  upperBound: PropTypes.string.isRequired,
  decimals: PropTypes.number.isRequired,
  marketType: PropTypes.string.isRequired,
  created: PropTypes.string.isRequired,
  resolutionDate: PropTypes.string.isRequired,
  probabilities: PropTypes.array,
  stagedProbabilities: PropTypes.array,
  tradeHistory: PropTypes.array.isRequired
};

export default probabilityChart;
