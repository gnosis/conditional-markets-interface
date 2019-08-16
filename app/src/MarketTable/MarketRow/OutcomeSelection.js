import React, { useCallback } from "react";
import PropTypes from "prop-types";

import cn from "classnames/bind";

import style from "./OutcomeSelection.scss";

const cx = cn.bind(style);

const OutcomeSelection = ({
  outcomes,
  marketSelection,
  setOutcomeSelection
}) => {
  const handleOutcomeSelect = useCallback(
    e =>
      setOutcomeSelection(
        e.target.value === "no-selection" ? -1 : parseInt(e.target.value, 10)
      ),
    [marketSelection]
  );

  return (
    <div className={cx("outcome-selection")}>
      <select
        name="marketOutcomeSelection"
        className={cx("outcome-selection-dropdown")}
        value={marketSelection.selectedOutcomeIndex}
        onChange={handleOutcomeSelect}
      >
        <option key={"no-selection"} value={-1}>
          No Preference
        </option>
        {outcomes.map((outcome, index) => (
          <option key={outcome.short} value={index}>
            {outcome.title}
          </option>
        ))}
      </select>
    </div>
  );
};

OutcomeSelection.propTypes = {
  outcomes: PropTypes.arrayOf(
    PropTypes.shape({
      short: PropTypes.string.isRequired
    }).isRequired
  ).isRequired,
  marketSelection: PropTypes.shape({
    selectedOutcomeIndex: PropTypes.number,
    isAssumed: PropTypes.bool.isRequired
  }),
  setOutcomeSelection: PropTypes.func.isRequired
};

export default OutcomeSelection;
