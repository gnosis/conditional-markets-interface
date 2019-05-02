import React from "react";
import PropTypes from "prop-types";

import cn from "classnames";

const OutcomeSelection = ({
  outcomes,
  conditionId,
  assumed,
  selectedOutcome,
  handleSelectAssumption,
  handleSelectOutcome
}) => (
  <div className={cn("outcome-selection")}>
    <div className={cn("row-outcomes")}>
      {outcomes.map((outcome, index) => (
        <button
          key={`${conditionId}-${index}`}
          className={cn("selection", { selected: selectedOutcome == index })}
          type="button"
          name={`${conditionId}-${index}`}
          onClick={handleSelectOutcome}
        >
          {outcome.short}
        </button>
      ))}
      <button
        className={cn("selection", { selected: !selectedOutcome })}
        type="button"
        name={`${conditionId}`}
        onClick={handleSelectOutcome}
      >
        {"I don't know"}
      </button>
    </div>
    <div className={cn("row-assume")}>
      <button
        type="button"
        disabled={selectedOutcome == null}
        className={cn("assume", {
          selected: assumed
        })}
        onClick={() => handleSelectAssumption(conditionId)}
      >
        <div>
          {selectedOutcome != null && (
            <input type="checkbox" readOnly checked={assumed} />
          )}
          <label>
            {selectedOutcome == null
              ? "To select an assumption, make a selection above"
              : `Assuming "${outcomes[selectedOutcome].short}" occurred`}
          </label>
        </div>
      </button>
    </div>
  </div>
);

OutcomeSelection.propTypes = {
  outcomes: PropTypes.arrayOf(
    PropTypes.shape({
      short: PropTypes.string.isRequired
    }).isRequired
  ).isRequired,
  conditionId: PropTypes.string.isRequired,
  assumed: PropTypes.bool.isRequired,
  selectedOutcome: PropTypes.string,
  handleSelectAssumption: PropTypes.func.isRequired,
  handleSelectOutcome: PropTypes.func.isRequired
};

export default OutcomeSelection;
