import React from "react";
import cn from "classnames/bind";

import style from "./outcomeCard.scss";
import { outcomeColors } from "utils/constants";

const cx = cn.bind(style);

const OutcomeCard = ({
  marketIndex,
  outcomeIndex,
  short,
  title,
  glueType,
  prefixType
}) => (
  <div
    className={cx("outcome-card", {
      [`glue-${glueType}`]: !!glueType,
      [`prefix-${prefixType}`]: !!prefixType
    })}
  >
    <span className={cx("market")}>#{marketIndex + 1}</span>
    <span className={cx("outcome")}>
      <i
        className={cx("dot")}
        style={{
          color: outcomeColors[outcomeIndex].darken(0.5).toString()
        }}
      />{" "}
      {title}
    </span>
  </div>
);

export default OutcomeCard;
