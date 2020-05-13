import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";
import Link from "@material-ui/core/Link";
import LinearProgress from "@material-ui/core/LinearProgress";
import InputLabel from "@material-ui/core/InputLabel";

import LoadingIcon from "assets/icons/loading-static.svg";

import {
  getCurrentUserTierData,
  isCurrentUserUpgrading,
  isCurrentUserActionRequired
} from "utils/tiers";

import style from "./tradingLimitIndicator.scss";

const cx = cn.bind(style);

// MIN = Minimum expected value
// MAX = Maximium expected value
// Function to normalise the values (MIN / MAX could be integrated)
const normalise = (value, min, max) => ((value - min) * 100) / (max - min);

const TradingLimitIndicator = ({ address, userState, tiers, openModal }) => {
  const [volume, setVolume] = useState(0);
  const [maxVolume, setMaxVolume] = useState(0);
  const [tier, setTier] = useState(0);
  const [warning, setWarning] = useState(false);

  useEffect(() => {
    if (userState && userState.tradingVolume) {
      setVolume(userState.tradingVolume.dollars);
    }
  }, [address, userState]);

  useEffect(() => {
    if (tiers && userState.tiers) {
      const { limit, name } = getCurrentUserTierData(tiers, userState);

      setWarning(false);
      setMaxVolume(limit);
      setTier(name);

      if (
        isCurrentUserUpgrading(tiers, userState) ||
        isCurrentUserActionRequired(tiers, userState)
      ) {
        setWarning(true);
        // setMaxVolume(0);
      }
    }
  }, [tiers, userState]);

  const getProgressLabel = useCallback(() => {
    if (isCurrentUserUpgrading(tiers, userState)) {
      return (
        <span>
          <img
            className={cx("progress-label-icon")}
            src={LoadingIcon}
            alt="Loading"
          />
          <strong>Pending tier upgrade</strong>
        </span>
      );
    } else if (isCurrentUserActionRequired(tiers, userState)) {
      return (
        <span>
          <strong>Action required.</strong>{" "}
          <Link
            className={cx("cancel-button")}
            component="button"
            onClick={() => {
              openModal("MyAccount", {
                tier,
                maxVolume
              });
            }}
            underline="always"
          >
            View details
          </Link>
        </span>
      );
    }

    return (
      <span>
        ${Number.parseFloat(volume).toFixed(2)} /
        <strong>{tier === "3" ? "Unlimited" : "$" + maxVolume}</strong>
      </span>
    );
  }, [tier, tiers, userState, volume, maxVolume]);

  return (
    <div className={cx("trading-indicator")}>
      <LinearProgress
        variant="determinate"
        value={warning ? 100 : normalise(volume, 0, maxVolume)}
        classes={{
          root: cx("linear-progress"),
          barColorPrimary: warning
            ? cx("linear-progress-bar-warning")
            : cx("linear-progress-bar")
        }}
      />
      <div className={cx("progress-label")}>{getProgressLabel()}</div>
      <InputLabel
        classes={{
          root: cx("indicator-label")
        }}
        onClick={() => {
          openModal("MyAccount", {
            tier,
            maxVolume
          });
        }}
      >
        Tier {tier}
      </InputLabel>
    </div>
  );
};

TradingLimitIndicator.propTypes = {
  address: PropTypes.string,
  tiers: PropTypes.array,
  userState: PropTypes.shape({
    tiers: PropTypes.shape({})
  }),
  openModal: PropTypes.func.isRequired
};

export default TradingLimitIndicator;
