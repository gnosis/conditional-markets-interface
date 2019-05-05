import React from "react";
import PropTypes from "prop-types";
import Decimal from "decimal.js-light";
import { formatProbability } from "./utils/formatting";

import cn from "classnames";

const clamp = (val, min, max) => (val < min ? min : val > max ? max : val);

const OutcomesBinary = ({ probabilities, isResolved }) => {
  const color = "lightblue";
  const probability = probabilities != null ? probabilities[0] : null;

  const predictionProbability = null;
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
    <div className={cn("binary-outcome", { closed: isResolved })}>
      <div className={cn("bar")} style={{ color }}>
        <div
          className={cn("inner")}
          style={{
            backgroundColor: color,
            borderColor: color,
            width: probability != null ? formatProbability(probability) : "50%"
          }}
        >
          <div className={cn("hint")}>
            <span className={cn("text")}>
              {probability != null ? formatProbability(probability) : "?"}
            </span>
          </div>
        </div>
        {displayPredictionProbability && (
          <div
            className={cn("prediction", {
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
              <div className={cn("hint")}>
                <span className={cn("text")}>
                  <small>PREDICTED CHANGE</small>{" "}
                  {(predictedProbabilityDifference * 100).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        )}
        {isResolved && (
          <div className={cn("predictions-before-close")}>
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
  probabilities: PropTypes.arrayOf(PropTypes.instanceOf(Decimal).isRequired),
  isResolved: PropTypes.bool.isRequired,
  predictionProbabilities: PropTypes.arrayOf(PropTypes.number.isRequired)
    .isRequired
};

export default OutcomesBinary;
