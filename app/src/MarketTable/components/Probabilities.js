import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";
import Decimal from "decimal.js-light";

import { probabilityDecimalPlaces } from "utils/constants";
import { formatProbability } from "utils/formatting";
import { categoricalMarketColors } from "utils/outcomes-color";

import style from "./probabilities.scss";

const cx = cn.bind(style);

const Probabilities = ({ outcomes, probabilities, stagedProbabilities }) => {
  const [displayedProbabilities, setDisplayedProbabilities] = useState(
    probabilities
  );

  useEffect(() => {
    stagedProbabilities
      ? setDisplayedProbabilities(stagedProbabilities)
      : setDisplayedProbabilities(probabilities);
  }, [probabilities, stagedProbabilities]);

  return (
    <div className={cx("probabilities")}>
      {displayedProbabilities && (
        <>
          {outcomes.map((outcome, index) => {
            const changeInProbability = displayedProbabilities[index]
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
  probabilities: PropTypes.arrayOf(PropTypes.instanceOf(Decimal)),
  stagedProbabilities: PropTypes.arrayOf(PropTypes.instanceOf(Decimal))
};

export default Probabilities;
