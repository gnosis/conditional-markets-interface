import React from "react";
import PropTypes from "prop-types";
import Collapse, { Panel } from "rc-collapse";
import OutcomesBinary from "../OutcomesBinary";
import OutcomeSelection from "../OutcomeSelection";
import OutcomeStats from "../OutcomeStats";
import cn from "classnames/bind";

import css from "./style.scss";

const cx = cn.bind(css);

const Market = ({
  title,
  resolutionDate,
  outcomes,
  conditionId,
  selectedOutcome,
  handleSelectOutcome,
  handleBuyOutcomes,
  disabled,
  isResolved,
  result,
  handleSelectSell,
  assumed,
  marketIndex,
  sellAmounts,
  handleSellOutcome,
  handleSelectAssumption,
  predictionProbabilities,
}) => {
  let probabilities = outcomes.map(outcome => outcome.probability);

  if (assumed) {
    probabilities = outcomes.map((outcome, outcomeIndex) =>
      parseInt(selectedOutcome, 10) === outcomeIndex ? 1 : 0
    );
  }

  let outcomesWithAssumation = outcomes.map((outcome, index) => ({
    ...outcome,
    probability: probabilities[index]
  }))

  return (
    <article className={cx("market", { disabled })}>
      <section className={cx("title-section")}>
        <h1 className={cx("title")}>{title}</h1>
        <div className={cx("title-infos")}>
          <div className={cx("title-info")}>
            {isResolved ? (
              <>
                <h2 className={cx("label")}>winning outcome</h2>
                <h2 className={cx("value", "centered")}>{outcomes[result].title}</h2>
              </>
            ) : (
              <>
                <h2 className={cx("label")}>probability</h2>
                <h2 className={cx("value")}>
                  {(probabilities[0] * 100).toFixed(2)}%
                </h2>
              </>
            )}
          </div>
          {isResolved ? (
            <div className={cx("title-info")}>
              <h2 className={cx("label")}>market closed</h2>
              <h2 className={cx("value")}></h2>
            </div>
          ) : (
            <div className={cx("title-info")}>
              <h2 className={cx("label")}>resolves</h2>
              <h2 className={cx("value")}>{(new Date(resolutionDate)).toLocaleString()}</h2>
            </div>
          )}
        </div>
      </section>
      <section className={cx("outcomes-section")}>
        <OutcomesBinary outcomes={outcomesWithAssumation} predictionProbabilities={assumed ? undefined : predictionProbabilities[marketIndex]} isResolved={isResolved} winningOutcome={result}/>
      </section>

      {!isResolved && <section className={cx("selection-section")}>
        <OutcomeSelection
          conditionId={conditionId}
          outcomes={outcomesWithAssumation}
          selectedOutcome={selectedOutcome}
          handleSelectAssumption={handleSelectAssumption}
          handleSelectOutcome={handleSelectOutcome}
          handleBuyOutcomes={handleBuyOutcomes}
          assumed={assumed}
        />
      </section>}
    </article>
  );
};

Market.propTypes = {
  title: PropTypes.string.isRequired,
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
