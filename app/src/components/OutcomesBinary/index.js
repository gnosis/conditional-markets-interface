import React from "react";

import cn from "classnames/bind";
import css from "./style.scss";

const cx = cn.bind(css);

const OutcomesBinary = ({
  outcomes: [{ probability, positionId, balance, color }, negativeOutcome]
}) => (
  <div className={cx("binary-outcome")}>
    <div className={cx("bar")} style={{ color }}>
      <div
        title={`${balance} Tokens @ ${positionId}`}
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
    </div>
  </div>
);

export default OutcomesBinary;
