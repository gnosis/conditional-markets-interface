import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import style from "./marketRow.scss";
import prepareQueryData from "./utils/prepareQueryData";

import Spinner from "components/Spinner";
import Graph from "components/Graph";

const cx = cn.bind(style);

import { useQuery } from "react-apollo";

import { lmsrAddress, getTrades } from "api/thegraph";

const probabilityChart = ({
  marketType,
  colSpan,
  probabilities,
  stagedProbabilities
}) => {
  const { loading, error, data } = useQuery(getTrades);

  const [chartOpen, setChartOpen] = useState(false);
  const handleToggleCollapse = useCallback(() => {
    setChartOpen(!chartOpen);
  }, [chartOpen]);

  if (loading) return <Spinner width={32} height={32} />;
  if (error) throw new Error(error);

  const parsedTrades = prepareQueryData([], data, lmsrAddress);
  // console.log(parsedTrades);

  const getProbabilitiesPercentage = value => value.mul(100).toNumber();
  const displayedProbabilities = probabilities
    ? probabilities.map(getProbabilitiesPercentage)
    : stagedProbabilities.map(getProbabilitiesPercentage);

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
          <div className={cx("tab-content")}>
            <Graph
              className={cx("graph")}
              lowerBound={0}
              upperBound={100}
              decimals={0}
              entries={parsedTrades}
              queryData={data}
              currentProbability={displayedProbabilities}
              marketType={marketType}
            ></Graph>
          </div>
        </td>
      </tr>
    </>
  );
};

probabilityChart.propTypes = {
  marketType: PropTypes.string.isRequired,

  colSpan: PropTypes.number.isRequired,
  probabilities: PropTypes.array,
  stagedProbabilities: PropTypes.array
};

export default probabilityChart;
