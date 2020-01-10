import React, { useCallback, useState, useMemo } from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import style from "./marketRow.scss";
import prepareTradesData from "../../utils/prepareTradesData";

import Spinner from "components/Spinner";
import Graph from "components/Graph";

const cx = cn.bind(style);

import { useQuery } from "@apollo/react-hooks";

import { GET_TRADES_BY_MARKET_MAKER } from "api/thegraph";

const probabilityChart = ({
  lmsrAddress,
  created,
  marketType,
  colSpan,
  probabilities,
  resolutionDate,
  stagedProbabilities
}) => {
  const { loading, error, data } = useQuery(GET_TRADES_BY_MARKET_MAKER, {
    variables: { marketMaker: lmsrAddress },
    pollInterval: 15000
  });

  const [chartOpen, setChartOpen] = useState(false);
  const handleToggleCollapse = useCallback(() => {
    setChartOpen(!chartOpen);
  }, [chartOpen]);

  const parsedTrades = useMemo(() => {
    if (!loading && data) {
      return prepareTradesData(
        { lowerBound: 0, upperBound: 100, type: marketType },
        data
      );
    } else return null;
  }, [marketType, data]);
  
  const getProbabilitiesPercentage = value => value.mul(100).toNumber();
  const displayedProbabilities = useMemo(() => {
    if (!probabilities) {
      return [];
    }
    stagedProbabilities
      ? probabilities.map(getProbabilitiesPercentage)
      : stagedProbabilities.map(getProbabilitiesPercentage);
  }, [probabilities, stagedProbabilities]);

  if (loading || !parsedTrades) return <Spinner width={32} height={32} />;
  if (error) throw new Error(error);

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
        </td>
      </tr>
    </>
  );
};

probabilityChart.propTypes = {
  lmsrAddress: PropTypes.string.isRequired,
  created: PropTypes.string.isRequired,
  marketType: PropTypes.string.isRequired,
  colSpan: PropTypes.number.isRequired,
  resolutionDate: PropTypes.string.isRequired,
  probabilities: PropTypes.array,
  stagedProbabilities: PropTypes.array
};

export default probabilityChart;
