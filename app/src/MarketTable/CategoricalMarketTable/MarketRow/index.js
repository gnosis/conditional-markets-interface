import React, { useCallback } from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import cn from "classnames/bind";
import Decimal from "decimal.js-light";

import Markdown from "react-markdown";

import style from "./marketRow.scss";

import Tabs from "../../components/Tabs";
import ResolutionTime from "../../components/ResolutionTime";
import Probabilities from "../../components/Probabilities";
import ProbabilityChart from "./probabilityChart";

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
  created,
  index,
  probabilities,
  stagedProbabilities,
  outcomes,
  marketSelections,
  collateral,
  disableConditional,
  setMarketSelection,
  tradeHistory,
  lmsrState
}) => {
  const handleToggleConditional = useCallback(
    isAssumed => {
      let outcomeSelections = [...marketSelections];
      outcomeSelections[index].isAssumed = isAssumed;
      setMarketSelection(prevValue => {
        return prevValue.map((marketSelection, marketSelectionIndex) => {
          if (index === marketSelectionIndex) {
            return {
              selectedOutcomeIndex: marketSelection.selectedOutcomeIndex,
              isAssumed
            };
          }
          return {
            ...marketSelection
          };
        });
      });
    },
    [marketSelections]
  );

  const entries = [
    `${index + 1}`,
    <>{title}</>,
    <Probabilities
      key="probabilities"
      outcomes={outcomes}
      probabilities={probabilities}
      stagedProbabilities={stagedProbabilities}
    />
  ];

  return (
    <>
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
            {formatCollateral(lmsrState.funding, collateral)}
          </div>
        </div>
        <Tabs tabTitles={["Chart", "Details"]}>
          <div className={cx("tab-content")}>
            <ProbabilityChart
              lmsrAddress={lmsrState.marketMakerAddress}
              marketType={type}
              created={created}
              probabilities={probabilities}
              resolutionDate={resolutionDate}
              stagedProbabilities={stagedProbabilities}
              tradeHistory={tradeHistory}
            ></ProbabilityChart>
            <Probabilities
              outcomes={outcomes}
              probabilities={probabilities}
              stagedProbabilities={stagedProbabilities}
            />
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
    </>
  );
};

Market.propTypes = {
  conditionId: PropTypes.any.isRequired,
  index: PropTypes.number.isRequired,

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

  marketSelections: PropTypes.arrayOf(
    PropTypes.shape({
      selectedOutcomeIndex: PropTypes.number.isRequired,
      isAssumed: PropTypes.bool.isRequired
    })
  ),
  setMarketSelection: PropTypes.any.isRequired,
  disableConditional: PropTypes.bool.isRequired,
  description: PropTypes.string,
  dataSource: PropTypes.string,
  dataSourceUrl: PropTypes.string,
  type: PropTypes.string.isRequired,
  lmsrState: PropTypes.shape({
    marketMakerAddress: PropTypes.string.isRequired
  }),
  created: PropTypes.string
};

Market.defaultProps = {
  description: "",
  dataSource: "",
  dataSourceUrl: ""
};

export default Market;
