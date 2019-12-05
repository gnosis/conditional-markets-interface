import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";
import Decimal from "decimal.js-light";

import style from "./marketRow.scss";
import prepareQueryData from "./utils/prepareQueryData";

import Spinner from "components/Spinner";
import Graph from "components/Graph";

const cx = cn.bind(style);

import gql from "graphql-tag";
import { useQuery } from "react-apollo";

import { lmsrAddress, getTrades } from "api/thegraph"

const probabilityChart = ({ marketType, lmsrState, colSpan }) => {
  const { loading, error, data } = useQuery(getTrades);

  const [chartOpen, setChartOpen] = useState(false);
  const handleToggleCollapse = useCallback(() => {
    setChartOpen(!chartOpen);
  }, [chartOpen]);

  // const disableChartCollapse = !description && !dataSource && !dataSourceUrl;
  if (loading) return <Spinner width={32} height={32} />;
  if (error) throw new Error(error);

  // const trades = data.outcomeTokenTrades.filter(
  //   ({ marketMaker }) => marketMaker.toLowerCase() === lmsrAddress.toLowerCase()
  // );
  // console.log(trades);
  const parsedTrades = prepareQueryData([], data, lmsrState)
  // console.log(parsedTrades);

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
              currentProbability={new Decimal(8)}
              marketType={marketType}
            ></Graph>
          </div>
        </td>
      </tr>
    </>
  );
};

probabilityChart.propTypes = {
  conditionId: PropTypes.any.isRequired,

  colSpan: PropTypes.number.isRequired,
  outcomes: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired
    }).isRequired
  ).isRequired,

  lmsrState: PropTypes.shape({
    stage: PropTypes.string.isRequired
  })
};

probabilityChart.defaultProps = {
  description: ""
};

export default probabilityChart;
