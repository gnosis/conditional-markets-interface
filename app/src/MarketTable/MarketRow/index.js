import React from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import cn from "classnames/bind";
import Decimal from "decimal.js-light";
import Markdown from "react-markdown";

import style from "./marketRow.scss";

import useGlobalState from "hooks/useGlobalState";

import Spinner from "components/Spinner";
import Tabs from "components/Tabs";
import ResolutionTime from "../components/ResolutionTime";
import Probabilities from "../components/Probabilities";
import ProbabilityChart from "../components/probabilityChart";

import { markdownRenderers } from "utils/markdown";
import { formatCollateral } from "utils/formatting";

const cx = cn.bind(style);

const { BN } = Web3.utils;

const Market = ({
  conditionId,
  title,
  resolutionDate,
  description,
  dataSource,
  dataSourceUrl,
  type,
  creationDate,
  probabilities,
  stagedProbabilities,
  outcomes,
  lowerBound,
  upperBound,
  decimals,
  unit,
  status,
  winningOutcome,
  tradeHistory
}) => {
  const { lmsrState, collateral } = useGlobalState();

  const resolutionValue =
    status === "RESOLVED" && winningOutcome != null
      ? parseFloat(winningOutcome)
      : null;

  const probabilityChartProps =
    type === "CATEGORICAL"
      ? {
          lowerBound: "0",
          upperBound: "100",
          decimals: 0,
          unit: "%"
        }
      : {
          lowerBound,
          upperBound,
          decimals,
          unit,
          resolutionValue
        };

  return (
    <div className={cx("market-row")} key={`market-${conditionId}`}>
      <div className={cx("header")}>{title}</div>
      <div className={cx("subheader")}>
        <div className={cx("property")}>
          <i className={cx("icon", "icon-time")} />{" "}
          <ResolutionTime date={resolutionDate} />
        </div>
        {dataSource && (
          <div className={cx("property")}>
            <i className={cx("icon", "icon-oracle")} />
            <>
              {dataSourceUrl ? (
                <a
                  className={cx("link-oracle")}
                  href={dataSourceUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {dataSource}
                </a>
              ) : (
                <>{dataSource}</>
              )}
            </>
          </div>
        )}
        <div className={cx("property")}>
          <i className={cx("icon", "icon-volume")} />{" "}
          {lmsrState && formatCollateral(lmsrState.funding, collateral)}
        </div>
      </div>
      <Tabs tabTitles={["Chart", "Details"]}>
        <div className={cx("tab-content")}>
          {!probabilities ? (
            <div className={cx("spinner")}>
              <Spinner centered inverted />
            </div>
          ) : (
            <>
              <ProbabilityChart
                {...probabilityChartProps}
                marketType={type}
                creationDate={creationDate}
                probabilities={probabilities}
                resolutionDate={resolutionDate}
                stagedProbabilities={stagedProbabilities}
                tradeHistory={tradeHistory}
              ></ProbabilityChart>
              {type === "CATEGORICAL" && (
                <Probabilities
                  outcomes={outcomes}
                  probabilities={probabilities}
                  stagedProbabilities={stagedProbabilities}
                />
              )}
            </>
          )}
        </div>
        <div className={cx("tab-content")}>
          {dataSource && (
            <>
              <h1>Data Source</h1>
              {dataSourceUrl ? (
                <a
                  href={dataSourceUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {dataSource}
                </a>
              ) : (
                <>{dataSource}</>
              )}
            </>
          )}
          <Markdown
            className={cx("description")}
            source={description || "*No Description for this Market*"}
            renderers={markdownRenderers}
          />
        </div>
      </Tabs>
    </div>
  );
};

Market.propTypes = {
  conditionId: PropTypes.any.isRequired,

  title: PropTypes.string.isRequired,
  resolutionDate: PropTypes.string.isRequired,
  outcomes: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired
    }).isRequired
  ).isRequired,

  resolutionState: PropTypes.shape({
    isResolved: PropTypes.bool.isRequired,
    payoutNumerators: PropTypes.arrayOf(PropTypes.instanceOf(BN).isRequired)
  }),

  probabilities: PropTypes.arrayOf(PropTypes.instanceOf(Decimal)),

  stagedProbabilities: PropTypes.arrayOf(
    PropTypes.instanceOf(Decimal).isRequired
  ),

  description: PropTypes.string,
  dataSource: PropTypes.string,
  dataSourceUrl: PropTypes.string,
  type: PropTypes.string.isRequired,
  creationDate: PropTypes.string
};

Market.defaultProps = {
  description: "",
  dataSource: "",
  dataSourceUrl: ""
};

export default Market;
