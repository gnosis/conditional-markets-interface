import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import cn from "classnames/bind";
import Decimal from "decimal.js-light";

import Markdown from "react-markdown";

import style from "./marketRow.scss";

import ResolutionDate from "./ResolutionDate";
import Probabilities from "./Probabilities";
import ProbabilityWording from "./ProbabilityWording";
import OutcomeSelection from "./OutcomeSelection";
import ToggleConditional from "./ToggleConditional";
import ProbabilityChart from "./probabilityChart";

import { markdownRenderers } from "utils/markdown";

const cx = cn.bind(style);

const { BN } = Web3.utils;

const Market = ({
  conditionId,
  title,
  headings,
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
  disableConditional,
  setMarketSelection,
  lmsrState
}) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const handleToggleCollapse = useCallback(() => {
    setDetailsOpen(!detailsOpen);
  }, [detailsOpen]);

  const handleMarketSelection = useCallback(
    selection => {
      setMarketSelection(prevValue => {
        return prevValue.map((marketSelection, marketSelectionIndex) => {
          if (index === marketSelectionIndex) {
            return {
              selectedOutcomeIndex: selection,
              isAssumed: selection === -1 ? false : marketSelection.isAssumed
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
    />,
    <ProbabilityWording
      key="probabilityWording"
      outcomes={outcomes}
      probabilities={probabilities}
      stagedProbabilities={stagedProbabilities}
    />,
    <ResolutionDate key="res_date" date={resolutionDate} />,
    marketSelections && (
      <OutcomeSelection
        key="selection"
        outcomes={outcomes}
        conditionId={conditionId}
        marketSelection={marketSelections[index]}
        setOutcomeSelection={handleMarketSelection}
      />
    ),
    marketSelections && !disableConditional && (
      <ToggleConditional
        key="conditional_topggle"
        disabled={
          !marketSelections[index].isAssumed &&
          marketSelections[index].selectedOutcomeIndex === -1
        }
        conditionId={conditionId}
        toggleConditional={handleToggleConditional}
        conditionalActive={marketSelections[index].isAssumed}
      />
    )
  ].filter(entry => entry !== false); // Filter disabled entries to avoid creating table element

  const disableCollapse = !description && !dataSource && !dataSourceUrl;

  return (
    <>
      <tr className={cx("market-row")} key={conditionId}>
        {entries.map((entry, index) => (
          <td key={`tr_row_${index}_${conditionId}`}>
            <div className={cx("market-row-heading")}>{headings[index]}</div>
            <div className={cx("market-row-content")}>{entry}</div>
          </td>
        ))}
      </tr>
      <ProbabilityChart
        lmsrAddress={lmsrState.marketMakerAddress}
        marketType={type}
        created={created}
        colSpan={headings.length}
        probabilities={probabilities}
        resolutionDate={resolutionDate}
        stagedProbabilities={stagedProbabilities}
      ></ProbabilityChart>
      <tr
        className={cx("market-row-tab", {
          hidden: !detailsOpen,
          disable: disableCollapse
        })}
        onClick={handleToggleCollapse}
      >
        <td colSpan={headings.length}>
          <button
            type="button"
            className={cx("expand-collapse")}
            onClick={handleToggleCollapse}
          >
            View market details
            <span className={cx("expand-collapse-icon")}>
              {detailsOpen ? "–" : "+"}
            </span>
          </button>
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
        </td>
      </tr>
    </>
  );
};

Market.propTypes = {
  conditionId: PropTypes.any.isRequired,
  index: PropTypes.number.isRequired,

  title: PropTypes.string.isRequired,
  headings: PropTypes.arrayOf(PropTypes.node).isRequired,
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
