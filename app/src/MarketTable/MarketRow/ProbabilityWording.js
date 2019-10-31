import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import style from "./probabilityWording.scss";

const cx = cn.bind(style);

const PROBABILITY_WORDING = [
  [[0, 1], "Impossible"],
  [[1, 20], "Almost certainly not"],
  [[20, 45], "Probaby not"],
  [[45, 55], "Chances about even"],
  [[55, 80], "Probable"],
  [[80, 99], "Almost certain"],
  [[99, 100], "Certain"]
];

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
            const stagedProbabilityFloat = displayedProbabilities[
              index
            ].toNumber();

            let selectedWording;
            PROBABILITY_WORDING.forEach(([[probFrom, probTo], label]) => {
              if (
                stagedProbabilityFloat >= probFrom / 100 &&
                stagedProbabilityFloat < probTo / 100
              ) {
                selectedWording = label;
              }
            });
            const probabilityWording = selectedWording;

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
