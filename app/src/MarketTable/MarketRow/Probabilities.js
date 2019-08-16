import React from "react";
import cn from "classnames/bind";

import style from "./probabilities.scss";
import { outcomeColors } from "utils/constants";

import { formatProbability } from "utils/formatting";

const cx = cn.bind(style);

const Probabilities = ({ outcomes, probabilities, stagedProbabilities }) => (
  <div className={cx("probabilities")}>
    {stagedProbabilities && (
      <>
        {outcomes.map((outcome, index) => (
          <div
            className={cx("probability")}
            key={outcome.short}
            style={{
              borderColor: outcomeColors[index].toString()
            }}
          >
            <div className={cx("label", "outcome")}>
              <i
                className={cx("dot")}
                style={{ color: outcomeColors[index].darken(0.5).toString() }}
              />{" "}
              <span>{outcome.title}</span>
            </div>
            <div
              className={cx("bar")}
              style={{
                width: `${stagedProbabilities[index].mul(100).toString()}%`,
                backgroundColor: outcomeColors[index].toString()
              }}
            />
            <div className={cx("label", "amount")}>
              {formatProbability(stagedProbabilities[index])}
            </div>
          </div>
        ))}
      </>
    )}
  </div>
);

export default Probabilities;
