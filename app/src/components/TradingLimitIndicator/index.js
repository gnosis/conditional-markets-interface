import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import LinearProgress from "@material-ui/core/LinearProgress";
import InputLabel from '@material-ui/core/InputLabel';

import style from "./tradingLimitIndicator.scss";

const cx = cn.bind(style);

// MIN = Minimum expected value
// MAX = Maximium expected value
// Function to normalise the values (MIN / MAX could be integrated)
const normalise = value => ((value - MIN) * 100) / (MAX - MIN);

const TradingLimitIndicator = () => {
  const [volume, setVolume] = React.useState(100);

  return (
    <div className={cx("trading-indicator")}>
      <LinearProgress
        variant="determinate"
        value={volume}
        classes={{
          root: cx("linear-progress"),
          barColorPrimary: cx("linear-progress-bar")
        }}
      />
      <div className={cx("progress-label")}>
        <span>
          105 / <strong>150€</strong>
        </span>
      </div>
      <InputLabel
        classes={{
          root: cx("indicator-label")
        }}
      >
        Tier 1
      </InputLabel>
    </div>
  );
};

export default TradingLimitIndicator;
