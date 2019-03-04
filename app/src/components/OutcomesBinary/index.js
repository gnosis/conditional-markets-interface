import React from "react";

import cn from "classnames/bind";
import css from "./style.scss";

const cx = cn.bind(css);

const OutcomesBinary = ({
  predictionProbabilities: [predictionProbability, negativeProbability],
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
      {predictionProbability != null && predictionProbability != probability && <div className={cx("prediction", { "inverted": predictionProbability < probability})}
        style={{
          backgroundColor: color,
          borderColor: color,
          left: predictionProbability > probability ? `${probability * 100}%` : 'auto',
          right: predictionProbability <= probability ? `${(1 - probability) * 100}%` : 'auto',
          width: `${Math.abs(predictionProbability - probability) * 100}%`
        }
      }
      >
      {predictionProbability != null && predictionProbability != probability && <div className={cx("hint")}>
        <span className={cx("text")}><small>PREDICTED CHANGE</small> {((predictionProbability - probability) * 100).toFixed(2)}%</span>
      </div>}
      </div>}
    </div>
  </div>
);

OutcomesBinary.defaultProps = {
  predictionProbabilities: []
}

export default OutcomesBinary;
