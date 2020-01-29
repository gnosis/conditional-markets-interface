import React from "react";
import cn from "classnames/bind";
import { formatScalarValue } from "utils/formatting";

import styles from "./Graph.scss";

const cx = cn.bind(styles);

const TooltipContent = ({ active, value, payload, unit, decimals }) => {
  if (active) {
    const number = value || payload[0].value;
    return (
      <div className={cx("tooltip-inner")}>
        {formatScalarValue(number, unit, decimals)}
      </div>
    );
  }

  return null;
};

export default TooltipContent;
