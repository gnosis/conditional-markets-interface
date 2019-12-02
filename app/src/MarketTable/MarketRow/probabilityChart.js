import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import style from "./marketRow.scss";

import Graph from "./graph";

const cx = cn.bind(style);

const probabilityChart = ({ conditionId, colSpan }) => {
  const [chartOpen, setChartOpen] = useState(false);
  const handleToggleCollapse = useCallback(() => {
    setChartOpen(!chartOpen);
  }, [chartOpen]);

  // const disableChartCollapse = !description && !dataSource && !dataSourceUrl;

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
              lowerBound={1}
              upperBound={2}
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
