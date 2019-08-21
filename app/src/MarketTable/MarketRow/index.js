import React, { useCallback } from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import cn from "classnames/bind";
import Decimal from "decimal.js-light";

import style from "./marketRow.scss";

import ResolutionDate from "./ResolutionDate";
import Probabilities from "./Probabilities";
import OutcomeSelection from "./OutcomeSelection";
import ToggleConditional from "./ToggleConditional";

const cx = cn.bind(style);

const { BN } = Web3.utils;

const Market = ({
  conditionId,
  title,
  headings,
  resolutionDate,
  index,
  probabilities,
  stagedProbabilities,
  outcomes,
  marketSelections,
  setMarketSelection
}) => {
  const handleMarketSelection = useCallback(
    selection => {
      let outcomeSelections = [...marketSelections];
      outcomeSelections[index].selectedOutcomeIndex = selection;
      setMarketSelection(outcomeSelections);
    },
    [marketSelections]
  );

  const handleToggleConditional = useCallback(
    isAssumed => {
      let outcomeSelections = [...marketSelections];
      outcomeSelections[index].isAssumed = isAssumed;
      setMarketSelection(outcomeSelections);
    },
    [marketSelections]
  );

  const entries = [
    `${index + 1}`,
    <>
      <span className={cx("mobile-index")}>#{index + 1}</span> {title}
    </>,
    <Probabilities
      key="probabilities"
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
    marketSelections && (
      <ToggleConditional
        key="conditional_topggle"
        disabled={marketSelections[index].selectedOutcomeIndex === -1}
        conditionId={conditionId}
        toggleConditional={handleToggleConditional}
        conditionalActive={marketSelections[index].isAssumed}
      />
    )
  ];

  return (
    <tr className={cx("market-row")} key={conditionId}>
      {entries.map((entry, index) => (
        <td key={`tr_row_${index}_${conditionId}`}>
          <div className={cx("market-row-heading")}>{headings[index]}</div>
          <div className={cx("market-row-content")}>{entry}</div>
        </td>
      ))}
    </tr>
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

  lmsrState: PropTypes.shape({
    stage: PropTypes.string.isRequired
  }),
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
  setMarketSelection: PropTypes.any.isRequired
};

export default Market;
