import React from "react";
import PropTypes from "prop-types";
import Collapse, { Panel } from "rc-collapse";
import Outcome from "../Outcome";
import OutcomeStats from "../OutcomeStats";
import cn from "classnames/bind";

import css from "./style.scss";

const cx = cn.bind(css);

const Market = ({
  title,
  description,
  outcomes,
  conditionId,
  selectedOutcomes,
  selectOutcomes,
  disabled,
  handleSelectSell,
  assumption,
  sellAmounts,
  handleSellOutcome
}) => {
  return (
    <div className={cx("market", { disabled })}>
      <h1 className={cx("title")}>{title}</h1>
      <p>{description}</p>
      <div className={cx("outcomes")}>
        {outcomes.map((outcome, index) => (
          <Outcome
            key={index}
            {...outcome}
            isDisabled={disabled}
            isCorrect={assumption == index}
            isSelected={selectedOutcomes[conditionId] === index}
            onSelectOutcome={() => selectOutcomes(conditionId, index)}
          />
        ))}
      </div>
      <div className={cx("outcome-stats")}>
        {outcomes.map(
          (outcome, index) =>
            outcome.balance && (
              <OutcomeStats
                key={index}
                isCorrect={assumption == index}
                isSelected={selectedOutcomes[conditionId] === index}
                {...outcome}
              />
            )
        )}
      </div>
      <div className={cx("sell-container")}>
        {outcomes.map((outcome, index) => {
          let sellAmount = sellAmounts[outcome.lmsrOutcomeIndex] || "";

          return (
            outcome.balance > 0 && (
              <Collapse className={cx("sell-wrapper")} key={index}>
                <Panel header="Click to sell outcome tokens">
                  <div className={cx("sell-form-wrapper")}>
                    <input
                      type="number"
                      className={cx("sell-input")}
                      placeholder="Amount to sell"
                      value={sellAmount}
                      onChange={e => handleSelectSell(e, outcome)}
                    />
                    <button
                      className={cx("sell-button")}
                      onClick={() =>
                        handleSellOutcome(outcome.lmsrOutcomeIndex)
                      }
                      type="button"
                      disabled={!sellAmount}
                    >
                      Sell Outcome Tokens
                    </button>
                  </div>
                </Panel>
              </Collapse>
            )
          );
        })}
      </div>
    </div>
  );
};

Market.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  outcomes: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      probability: PropTypes.number,
      price: PropTypes.string
    })
  )
};

Market.defaultProps = {
  selectedOutcomes: {}
};

export default Market;
