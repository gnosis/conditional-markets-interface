import React from "react";
import cn from "classnames/bind";

import style from "./outcomeCard.scss";

const cx = cn.bind(style);

export const Dot = ({ index }) => (
  <i
    className={cx("dot", index ? "no" : "yes")}
    style={{
      color: (index > -1
        ? outcomeColors[index].darken(0.5)
        : "#ececec"
      ).toString()
    }}
  />
);

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
      [`glue`]: !!glueType,
      [`glue--${glueType}`]: !!glueType,
      [`prefix`]: !!prefixType,
      [`prefix--${prefixType}`]: !!prefixType
    })}
  >
    <span className={cx("market")}>
      {marketIndex !== "*" ? `#${marketIndex + 1}` : ' /'}
    </span>
    <span className={cx("outcome")}>
      <Dot index={outcomeIndex} /> {title}
    </span>
  </div>
);

export default OutcomeCard;
