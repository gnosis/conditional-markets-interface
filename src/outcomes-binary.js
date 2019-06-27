import React from "react";
import PropTypes from "prop-types";
import Decimal from "decimal.js-light";
import { oneDecimal, minDisplayedProbability } from "./utils/constants";
import { formatProbability } from "./utils/formatting";

import cn from "classnames";

const OutcomesBinary = ({ probabilities, stagedProbabilities }) => {
  const color = "lightblue";
  const probability = probabilities != null ? probabilities[0] : null;

  let stagedProbability;
  let stagedProbabilityDifference;
  let absStagedProbabilityDifference;
  let shouldDisplayStagedProbability;
  let estimatedHintPosition;
  if (stagedProbabilities != null) {
    stagedProbability = stagedProbabilities[0];
    stagedProbabilityDifference = stagedProbability.sub(probability);
    absStagedProbabilityDifference = stagedProbabilityDifference.abs();
    shouldDisplayStagedProbability = absStagedProbabilityDifference.gte(
      minDisplayedProbability
    );

    estimatedHintPosition = probability.add(stagedProbability).mul(0.5);
  }

  return (
    <div className={cn("binary-outcome")}>
      <div className={cn("bar")} style={{ color }}>
        <div
          className={cn("inner-bar", "current")}
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
        {shouldDisplayStagedProbability && (
          <div
            className={cn("inner-bar", "staged", {
              inverted: stagedProbability.lt(probability),
              "shift-left": estimatedHintPosition.lt(".2"),
              "shift-right": estimatedHintPosition.gt(".8")
            })}
            style={{
              backgroundColor: color,
              borderColor: color,
              left: stagedProbability.gt(probability)
                ? formatProbability(probability)
                : "auto",
              right: stagedProbability.lt(probability)
                ? formatProbability(oneDecimal.sub(probability))
                : "auto",
              width: formatProbability(absStagedProbabilityDifference)
            }}
          >
            {shouldDisplayStagedProbability && (
              <div className={cn("hint")}>
                <span className={cn("text")}>
                  <small>PREDICTED CHANGE</small>{" "}
                  {formatProbability(stagedProbabilityDifference)}
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
