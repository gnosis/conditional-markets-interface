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
    </div>
    
    <div className={cx("row-buy")}>
      <input
        type="text"
        placeholder="Amount of shares to buy"
        value={assumed ? '/' : (invest || "")}
        disabled={assumed}
        onChange={(e) => handleSelectInvest(conditionId, e)}
        className={cx("invest")}
      />
      <button
        type="button"
        name={`${conditionId}-buy`}
        disabled={assumed || selectedOutcome == null || invest === 0}
        onClick={handleBuyOutcomes}
      >
      Buy
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
        <input
          type="checkbox"
          readOnly
          checked={assumed}
        />
        <label>{selectedOutcome == null ? "Make an Assumption" : `Assume "${outcomes[selectedOutcome].short}" occoured`}</label>
      </button>
    </div>
  </div>
);

export default OutcomeSelection;
