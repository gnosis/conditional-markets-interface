import React from "react";
import PropTypes from "prop-types";
import OutcomesBinary from "./outcomes-binary";
import OutcomeSelection from "./outcome-selection";

import cn from "classnames";

const Market = ({
  title,
  resolutionDate,
  outcomes,
  conditionId,
  isResolved,
  result,

  assumed,
  disabled,
  selectedOutcome,

  predictionProbabilities,

  marketIndex,

  handleSelectAssumption,
  handleSelectOutcome
}) => {
  let probabilities = outcomes.map(outcome => outcome.probability);

  if (assumed) {
    probabilities = outcomes.map((outcome, outcomeIndex) =>
      parseInt(selectedOutcome, 10) === outcomeIndex ? 1 : 0
    );
  }

  let outcomesWithProbabilities = outcomes.map((outcome, index) => ({
    ...outcome,
    probability: probabilities[index]
  }));

  return (
    <article className={cn("market", { disabled })}>
      <section className={cn("title-section")}>
        <h1 className={cn("title")}>{title}</h1>
        <div className={cn("title-infos")}>
          <div className={cn("title-info")}>
            {isResolved ? (
              <>
                <h2 className={cn("label")}>winning outcome</h2>
                <h2 className={cn("value", "centered")}>
                  {outcomes[result].title}
                </h2>
              </>
            ) : (
              <>
                <h2 className={cn("label")}>probability</h2>
                <h2 className={cn("value")}>
                  {(probabilities[0] * 100).toFixed(2)}%
                </h2>
              </>
            )}
          </div>
          {isResolved ? (
            <div className={cn("title-info")}>
              <h2 className={cn("label")}>market closed</h2>
              <h2 className={cn("value")} />
            </div>
          ) : (
            <div className={cn("title-info")}>
              <h2 className={cn("label")}>resolves</h2>
              <h2 className={cn("value")}>
                {new Date(resolutionDate).toLocaleString()}
              </h2>
            </div>
          )}
        </div>
      </section>
      <section className={cn("outcomes-section")}>
        <OutcomesBinary
          {...{
            outcomes: outcomesWithProbabilities,
            isResolved,
            predictionProbabilities: assumed
              ? []
              : predictionProbabilities[marketIndex] || []
          }}
        />
      </section>

      {!isResolved && (
        <section className={cn("selection-section")}>
          <OutcomeSelection
            {...{
              outcomes,
              conditionId,
              assumed,
              selectedOutcome,
              handleSelectAssumption,
              handleSelectOutcome
            }}
          />
        </section>
      )}
    </article>
  );
};

Market.propTypes = {
  title: PropTypes.string.isRequired,
  resolutionDate: PropTypes.string.isRequired,
  outcomes: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      probability: PropTypes.number.isRequired
    }).isRequired
  ).isRequired,
  conditionId: PropTypes.any.isRequired,
  isResolved: PropTypes.bool.isRequired,
  result: PropTypes.number.isRequired,

  assumed: PropTypes.bool.isRequired,
  disabled: PropTypes.bool.isRequired,
  selectedOutcome: PropTypes.string,

  predictionProbabilities: PropTypes.arrayOf(PropTypes.array.isRequired)
    .isRequired,

  marketIndex: PropTypes.number.isRequired,

  handleSelectAssumption: PropTypes.any.isRequired,
  handleSelectOutcome: PropTypes.any.isRequired
};

Market.defaultProps = {
  selectedOutcomes: {}
};

export default Market;
