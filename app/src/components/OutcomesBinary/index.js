import React from "react";

import cn from "classnames/bind";
import css from "./style.scss";

const cx = cn.bind(css);

const OutcomesBinary = ({
  predictionProbabilities = [],
  outcomes: [{ probability, positionId, balance, color }, negativeOutcome]
}) => (
  <div className={cx("binary-outcome")}>
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
          <span className={cx("text")}>{(probability * 100).toFixed(2)}%</span>
        </div>
      </div>
      <div className={cx("inner-prediction")}
        style={{
          backgroundColor: color,
          opacity: 0.7,
          width: `${predictionProbabilities[0] * 100}%`
        }
      }
      >
      </div>
    </div>
  </div>
);

export default OutcomesBinary;
