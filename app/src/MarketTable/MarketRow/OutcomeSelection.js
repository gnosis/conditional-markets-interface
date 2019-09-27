import React, { useCallback } from "react";
import PropTypes from "prop-types";

import cn from "classnames/bind";
import Select from "react-select";

import style from "./OutcomeSelection.scss";

import { Dot } from "components/OutcomeCard";

const cx = cn.bind(style);

const OutcomeSelection = ({
  outcomes,
  marketSelection,
  setOutcomeSelection
}) => {
  const handleOutcomeSelect = useCallback(
    ({ value }) => {
      setOutcomeSelection(value === "no-selection" ? -1 : parseInt(value, 10));
    },
    [marketSelection]
  );

  const options = [
    { value: "no-selection", label: "Select Outcome" },
    ...outcomes.map((outcome, index) => ({
      label: (
        <>
          <Dot index={index} /> {outcome.title}
        </>
      ),
      value: index
    }))
  ];

  return (
    <div>
      <Select
        options={options}
        defaultValue={{ value: "no-selection", label: "Select Outcome" }}
        className={cx("outcome-selection")}
        value={options[marketSelection.selectedOutcomeIndex + 1]}
        classNamePrefix="outcome-selection"
        onChange={handleOutcomeSelect}
      />
      {/*
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
      </select> */}
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
