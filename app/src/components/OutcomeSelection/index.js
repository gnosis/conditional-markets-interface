import React from "react";
import cn from "classnames/bind";
import style from "./style.scss";

const cx = cn.bind(style);

const OutcomeSelection = ({
  conditionId,
  outcomes,
  assumed,
  handleSelectAssumption,
  handleSelectOutcome,
  handleBuyOutcomes,
  selectedOutcome,
  invest,
  handleSelectInvest,
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
      >I don't know</button>
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
          <input
            type="checkbox"
            readOnly
            checked={assumed}
          />
          <label>{selectedOutcome == null ? "Select a Condition" : `Select "${outcomes[selectedOutcome].short}" as condition`}</label>
        </div>
      </button>
    </div>
  </div>
);

export default OutcomeSelection;
