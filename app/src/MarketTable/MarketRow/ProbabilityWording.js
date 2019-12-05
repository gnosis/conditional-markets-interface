import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import style from "./probabilityWording.scss";

const cx = cn.bind(style);

const minimalDecimals = 2;

const PROBABILITY_WORDING = [
  [[0], "Impossible"], // 0
  [[0, 5], "Remote"], // 0.000001 - 0.05
  [[5, 20], "Highly improbable"], // 0.050001 - 0.2
  [[20, 45], "Improbable"], // 0.20001 - 0.45
  [[45, 55], "Roughly even odds"],
  [[55, 80], "Probable"],
  [[80, 95], "Highly probable"],
  [[95, 100 - Math.pow(10, -minimalDecimals)], "Nearly certain"],
  [[100], "Certain"]
];

const getLabelWording = stagedProbability => {
  const selectedWording = PROBABILITY_WORDING.find(([probabilityRange]) => {
    if (probabilityRange.length === 2) {
      const [probFrom, probTo] = probabilityRange;
      return stagedProbability >= probFrom && stagedProbability <= probTo;
    } else if (probabilityRange.length === 1) {
      const [probabilityExact] = probabilityRange;
      return (
        stagedProbability > probabilityExact - Math.pow(10, -minimalDecimals) &&
        stagedProbability < probabilityExact + Math.pow(10, -minimalDecimals)
      );
    } else {
      console.warn("Invalid probability wording Range");
    }
  });
  if (!selectedWording) return ""; // To avoid crashes for OOR

  const [, label] = selectedWording;

  return label;
};

const ProbabilityWording = ({
  outcomes,
  probabilities,
  stagedProbabilities
}) => {
  const displayedProbabilities = probabilities
    ? probabilities
    : stagedProbabilities;
  return (
    <div className={cx("wordings")}>
      {displayedProbabilities && (
        <>
          {outcomes.map((outcome, index) => {
            const stagedProbability = displayedProbabilities[index]
              .mul(100)
              .toNumber();

            const probabilityWording = getLabelWording(stagedProbability);

            return (
              <div
                className={cx("outcome-probability-wording")}
                key={outcome.short}
              >
                <span className={cx("words-of-probability")}>
                  {probabilityWording}
                </span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

ProbabilityWording.propTypes = {
  outcomes: PropTypes.arrayOf(PropTypes.object),
  probabilities: PropTypes.arrayOf(PropTypes.number),
  stagedProbabilities: PropTypes.arrayOf(PropTypes.object)
};

export default ProbabilityWording;
