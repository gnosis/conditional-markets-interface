import React, { useCallback, useState, useMemo } from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import style from "./marketRow.scss";
import prepareTradesData from "utils/prepareTradesData";

import Graph from "components/Graph";

const cx = cn.bind(style);

const probabilityChart = ({
  created,
  marketType,
  colSpan,
  probabilities,
  resolutionDate,
  stagedProbabilities,
  tradeHistory
}) => {
  const [chartOpen, setChartOpen] = useState(false);
  const handleToggleCollapse = useCallback(() => {
    setChartOpen(!chartOpen);
  }, [chartOpen]);

  const parsedTrades = useMemo(() => {
    console.log("useMemo", tradeHistory)
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
    <>
      <tr
        className={cx("market-row-tab", {
          hidden: !chartOpen
          // disable: disableChartCollapse
        })}
        onClick={handleToggleCollapse}
      >
        <td colSpan={colSpan}>
          <button
            type="button"
            className={cx("expand-collapse")}
            onClick={handleToggleCollapse}
          >
            Probability Chart
            <span className={cx("expand-collapse-icon")}>
              {chartOpen ? "–" : "+"}
            </span>
          </button>
          {chartOpen && (
            <div className={cx("tab-content")}>
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
            </div>
          )}
        </td>
      </tr>
    </>
  );
};

probabilityChart.propTypes = {
  created: PropTypes.string.isRequired,
  marketType: PropTypes.string.isRequired,
  colSpan: PropTypes.number.isRequired,
  resolutionDate: PropTypes.string.isRequired,
  probabilities: PropTypes.array,
  stagedProbabilities: PropTypes.array,
  tradeHistory: PropTypes.shape({ results: PropTypes.array }).isRequired
};

export default probabilityChart;
