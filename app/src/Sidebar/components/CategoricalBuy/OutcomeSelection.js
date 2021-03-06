import React, { useCallback } from "react";
import PropTypes from "prop-types";

// Components
import Select from "react-select";
import { Dot } from "components/OutcomeCard";

import { formatProbability } from "utils/formatting";

// Styles
import cn from "classnames/bind";
import style from "./OutcomeSelection.scss";

const cx = cn.bind(style);

const OutcomeSelection = ({
  outcomes,
  probabilities,
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
          <Dot index={index} />
          <span className={cx("outcome-title")}>{outcome.title}</span>
          {probabilities && (
            <span className={cx("outcome-probability")}>
              ({formatProbability(probabilities[index])})
            </span>
          )}
        </>
      ),
      value: index
    }))
  ];

  return (
    <Select
      options={options}
      defaultValue={{ value: "no-selection", label: "Select Outcome" }}
      className={cx("outcome-selection")}
      value={options[marketSelection.selectedOutcomeIndex + 1]}
      classNamePrefix="outcome-selection"
      onChange={handleOutcomeSelect}
    />
  );
};

OutcomeSelection.propTypes = {
  outcomes: PropTypes.arrayOf(
    PropTypes.shape({
      short: PropTypes.string.isRequired
    }).isRequired
  ).isRequired,
  probabilities: PropTypes.array,
  marketSelection: PropTypes.shape({
    selectedOutcomeIndex: PropTypes.number,
    isAssumed: PropTypes.bool.isRequired
  }),
  setOutcomeSelection: PropTypes.func.isRequired
};

export default OutcomeSelection;
