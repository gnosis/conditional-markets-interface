import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import { probabilityDecimalPlaces } from "utils/constants";
import { formatProbability } from "utils/formatting";
import { categoricalMarketColors } from "utils/outcomes-color";

import style from "./probabilities.scss";

const cx = cn.bind(style);

const Probabilities = ({ outcomes, probabilities, stagedProbabilities }) => {
  const displayedProbabilities = stagedProbabilities
    ? stagedProbabilities
    : probabilities;

  return (
    <div className={cx("probabilities")}>
      {displayedProbabilities && (
        <>
          {outcomes.map((outcome, index) => {
            const changeInProbability = (stagedProbabilities || probabilities)[
              index
            ]
              .sub(probabilities[index])
              .mul(100)
              .toDecimalPlaces(probabilityDecimalPlaces);
            return (
              <div
                className={cx("outcome-bar", {
                  "staged-display": changeInProbability.abs().gt(0.01)
                })}
                key={outcome.short}
              >
                <div className={cx("probability")}>
                  <div className={cx("label", "outcome")}>
                    <i
                      className={cx("dot")}
                      style={{
                        color: categoricalMarketColors[index]
                      }}
                    />{" "}
                    <span>{outcome.title}</span>
                  </div>
                  <div className={cx("label", "amount")}>
                    {" - "}
                    {formatProbability(displayedProbabilities[index])}
                  </div>
                </div>

                {changeInProbability.abs().gt(0.01) && (
                  <span
                    className={cx("change-percentage", {
                      negative: changeInProbability.lt(0)
                    })}
                  >
                    {changeInProbability.toString()}%
                  </span>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

Probabilities.propTypes = {
  outcomes: PropTypes.arrayOf(PropTypes.object),
  probabilities: PropTypes.arrayOf(PropTypes.number),
  stagedProbabilities: PropTypes.arrayOf(PropTypes.object)
};

export default Probabilities;
