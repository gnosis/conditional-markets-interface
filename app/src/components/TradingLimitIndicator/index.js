import React, { useEffect } from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import { getCurrentTradingVolume } from "api/whitelist";

import LinearProgress from "@material-ui/core/LinearProgress";
import InputLabel from "@material-ui/core/InputLabel";

import style from "./tradingLimitIndicator.scss";

const cx = cn.bind(style);

const MIN = 0;
const MAX = 150;

// MIN = Minimum expected value
// MAX = Maximium expected value
// Function to normalise the values (MIN / MAX could be integrated)
const normalise = value => ((value - MIN) * 100) / (MAX - MIN);

const TradingLimitIndicator = ({ openModal, account }) => {
  const [volume, setVolume] = React.useState(0);

  useEffect(() => {
    setVolume(getCurrentTradingVolume());
  }, []);

  return (
    <div
      className={cx("trading-indicator")}
      onClick={() =>
        openModal("tradeOverLimit", {
          account,
          tier: 1,
          volume,
          maxVolume: MAX,
          tradeValue: 12,
          openModal
        })
      }
    >
      <LinearProgress
        variant="determinate"
        value={normalise(volume)}
        classes={{
          root: cx("linear-progress"),
          barColorPrimary: cx("linear-progress-bar")
        }}
      />
      <div className={cx("progress-label")}>
        <span>
          {volume}€ / <strong>{MAX}€</strong>
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
