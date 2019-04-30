import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";
import css from "./style.scss";

const clamp = (val, min, max) => (val < min ? min : val > max ? max : val);

const cx = cn.bind(css);

const OutcomesBinary = ({
  outcomes: [{ probability, color } /*, negativeOutcome */],
  isResolved,
  predictionProbabilities: [predictionProbability /*, negativeProbability */]
}) => {
  const predictedProbabilityDifference = clamp(
    predictionProbability - probability,
    -1,
    1
  );
  const displayPredictionProbability =
    predictionProbability != null &&
    predictionProbability != probability &&
    !isResolved;

  const estimatedHintPosition =
    Math.abs(probability) + predictionProbability / 2;

  return (
    <div className={cx("binary-outcome", { closed: isResolved })}>
      <div className={cx("bar")} style={{ color }}>
        <div
          className={cx("inner")}
          style={{
            backgroundColor: color,
            borderColor: color,
            width: `${probability * 100}%`
          }}
        >
          <div className={cx("hint")}>
            <span className={cx("text")}>
              {(probability * 100).toFixed(2)}%
            </span>
          </div>
        </div>
        {displayPredictionProbability && (
          <div
            className={cx("prediction", {
              inverted: predictionProbability < probability,
              shiftLeft: estimatedHintPosition < 0.2,
              shiftRight: estimatedHintPosition > 0.8
            })}
            style={{
              backgroundColor: color,
              borderColor: color,
              left:
                predictionProbability > probability
                  ? `${probability * 100}%`
                  : "auto",
              right:
                predictionProbability <= probability
                  ? `${(1 - probability) * 100}%`
                  : "auto",
              width: `${Math.abs(predictedProbabilityDifference) * 100}%`
            }}
          >
            {displayPredictionProbability && (
              <div className={cx("hint")}>
                <span className={cx("text")}>
                  <small>PREDICTED CHANGE</small>{" "}
                  {(predictedProbabilityDifference * 100).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        )}
        {isResolved && (
          <div className={cx("predictions-before-close")}>
            <em>Final Predictions before market was resolved</em>
          </div>
        )}
      </div>
    </div>
  );
};

OutcomesBinary.propTypes = {
  outcomes: PropTypes.arrayOf(
    PropTypes.shape({
      probability: PropTypes.number.isRequired,
      color: PropTypes.string.isRequired
    }).isRequired
  ).isRequired,
  isResolved: PropTypes.bool.isRequired,
  predictionProbabilities: PropTypes.arrayOf(PropTypes.number.isRequired)
    .isRequired
};

export default OutcomesBinary;
