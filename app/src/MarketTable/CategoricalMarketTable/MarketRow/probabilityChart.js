import React, { useMemo } from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import style from "./marketRow.scss";
import prepareTradesData from "utils/prepareTradesData";

import Graph from "components/Graph";

const cx = cn.bind(style);

const probabilityChart = ({
  created,
  marketType,
  probabilities,
  resolutionDate,
  stagedProbabilities,
  tradeHistory
}) => {
  const parsedTrades = useMemo(() => {
    if (tradeHistory) {
      return prepareTradesData(
        { lowerBound: 0, upperBound: 100, type: marketType },
        tradeHistory
      );
    } else return [];
  }, [marketType, tradeHistory]);

  const getProbabilitiesPercentage = value => value.mul(100).toNumber();
  const displayedProbabilities = useMemo(
    () =>
      probabilities
        ? probabilities.map(getProbabilitiesPercentage)
        : stagedProbabilities.map(getProbabilitiesPercentage),
    [probabilities, stagedProbabilities]
  );

  return (
    <Graph
      className={cx("graph")}
      lowerBound={"0"}
      upperBound={"100"}
      decimals={0}
      entries={parsedTrades}
      resolutionDate={resolutionDate}
      currentProbability={displayedProbabilities}
      marketType={marketType}
      created={created}
    ></Graph>
  );
};

probabilityChart.propTypes = {
  created: PropTypes.string.isRequired,
  marketType: PropTypes.string.isRequired,
  resolutionDate: PropTypes.string.isRequired,
  probabilities: PropTypes.array,
  stagedProbabilities: PropTypes.array,
  tradeHistory: PropTypes.array.isRequired
};

export default probabilityChart;
