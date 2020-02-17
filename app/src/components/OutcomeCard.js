import React from "react";
import cn from "classnames/bind";

import style from "./outcomeCard.scss";
import { categoricalMarketColors } from "utils/outcomes-color";

const cx = cn.bind(style);

export const Dot = ({ index }) => (
  <i
    className={cx("dot")}
    style={{
      color: categoricalMarketColors[index]
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
      {marketIndex !== "*" ? `#${marketIndex + 1}` : " /"}
    </span>
    <span className={cx("outcome")}>
      <Dot index={outcomeIndex} /> {title}
    </span>
  </div>
);

export default OutcomeCard;
