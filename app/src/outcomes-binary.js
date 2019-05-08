import React from "react";
import PropTypes from "prop-types";
import Decimal from "decimal.js-light";
import { formatProbability } from "./utils/formatting";

import cn from "classnames";

const OutcomesBinary = ({ probabilities, stagedProbabilities }) => {
  const color = "lightblue";
  const probability = probabilities != null ? probabilities[0] : null;

  let stagedProbability;
  let predictedProbabilityDifference;
  let absPredictedProbabilityDifference;
  let displayPredictionProbability;
  let estimatedHintPosition;
  if (stagedProbabilities != null) {
    stagedProbability = stagedProbabilities[0];
    predictedProbabilityDifference = stagedProbability.sub(probability);
    absPredictedProbabilityDifference = predictedProbabilityDifference.abs();
    displayPredictionProbability = absPredictedProbabilityDifference.gte(
      "0.0001"
    );

    estimatedHintPosition = probability.add(stagedProbability).mul(0.5);
  }

  return (
    <div className={cn("binary-outcome")}>
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
              inverted: stagedProbability.lt(probability),
              shiftLeft: estimatedHintPosition.lt(".2"),
              shiftRight: estimatedHintPosition.gt(".8")
            })}
            style={{
              backgroundColor: color,
              borderColor: color,
              left: stagedProbability.gt(probability)
                ? formatProbability(probability)
                : "auto",
              right: stagedProbability.lt(probability)
                ? formatProbability(new Decimal(1).sub(probability))
                : "auto",
              width: formatProbability(absPredictedProbabilityDifference)
            }}
          >
            {displayPredictionProbability && (
              <div className={cn("hint")}>
                <span className={cn("text")}>
                  <small>PREDICTED CHANGE</small>{" "}
                  {formatProbability(predictedProbabilityDifference)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

OutcomesBinary.propTypes = {
  probabilities: PropTypes.arrayOf(PropTypes.instanceOf(Decimal).isRequired),
  stagedProbabilities: PropTypes.arrayOf(
    PropTypes.instanceOf(Decimal).isRequired
  )
};

export default OutcomesBinary;
