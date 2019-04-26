import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";
import style from "./style.scss";

const cx = cn.bind(style);

const OutcomeSelection = ({
  conditionId,
  outcomes,
  assumed,
  handleSelectAssumption,
  handleSelectOutcome,
  selectedOutcome
}) => (
  <div className={cx("outcome-selection")}>
    <div className={cx("row-outcomes")}>
      {outcomes.map((outcome, index) => (
        <button
          key={`${conditionId}-${index}`}
          className={cx("selection", { selected: selectedOutcome == index })}
          type="button"
          name={`${conditionId}-${index}`}
          onClick={handleSelectOutcome}
        >
          {outcome.short}
        </button>
      ))}
      <button
        className={cx("selection", { selected: !selectedOutcome })}
        type="button"
        name={`${conditionId}`}
        onClick={handleSelectOutcome}
      >
        {"I don't know"}
      </button>
    </div>
    <div className={cx("row-assume")}>
      <button
        type="button"
        disabled={selectedOutcome == null}
        className={cx("assume", {
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
  conditionId: PropTypes.string.isRequired,
  outcomes: PropTypes.arrayOf(
    PropTypes.shape({
      short: PropTypes.string.isRequired
    }).isRequired
  ).isRequired,
  assumed: PropTypes.bool.isRequired,
  handleSelectAssumption: PropTypes.func.isRequired,
  handleSelectOutcome: PropTypes.func.isRequired,
  selectedOutcome: PropTypes.string
};

export default OutcomeSelection;
