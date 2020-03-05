import React, { useMemo } from "react";
import PropTypes from "prop-types";

import cn from "classnames/bind";

import Redeem from "./Redeem";

import style from "./resolved.scss";
import prepareTradesData from "utils/prepareTradesData";

const cx = cn.bind(style);

const Resolved = ({ markets, tradeHistory, ...props }) => {
  const targetMarket = markets[0];

  if (markets.length > 1) {
    return (
      <div className={cx("resolved")}>
        Resolution for multiple markets not yet implemented!
        <br />
        Contact Support
      </div>
    );
  }

  const fullyResolved = markets.every(market => market.winningOutcome != null);

  const tradeData = useMemo(() => {
    if (tradeHistory) {
      return prepareTradesData(
        {
          lowerBound: targetMarket.lowerBound || 0,
          upperBound: targetMarket.upperBound || 100,
          type: targetMarket.type
        },
        tradeHistory
      );
    } else return [];
  }, [tradeHistory, markets[0]]);
  const lastTrade =
    tradeData.length > 0 ? tradeData[tradeData.length - 1] : null;

  return fullyResolved ? (
    <div className={cx("resolved")}>
      <p className={cx("resolve-entry", "winning-value")}>
        <span className={cx("label")}>Market resolved to:</span>
        <span className={cx("value")}>
          {targetMarket.winningOutcome}{" "}
          {targetMarket.type === "SCALAR" && (targetMarket.unit || "Units")}
        </span>
      </p>
      {targetMarket.type === "SCALAR" &&
        lastTrade &&
        lastTrade.outcomesProbability && (
          <p className={cx("resolve-entry", "last-trade")}>
            <span className={cx("label")}>Last trade on market:</span>
            <span className={cx("value")}>
              {lastTrade.outcomesProbability[0]} {targetMarket.unit || "Units"}
            </span>
          </p>
        )}
      <Redeem markets={markets} {...props} />
    </div>
  ) : (
    <div className={cx("resolved")}>
      <h1 className={cx("waiting-for-oracle")}>
        Market closed but not all winning outcome were set yet. Please wait
        until the oracle is fully resolved.
      </h1>
    </div>
  );
};

Resolved.propTypes = {
  markets: PropTypes.arrayOf(
    PropTypes.shape({
      lowerBound: PropTypes.string.isRequired,
      upperBound: PropTypes.string.isRequired,
      unit: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      outcomes: PropTypes.arrayOf(
        PropTypes.shape({
          positions: PropTypes.arrayOf(
            PropTypes.shape({
              id: PropTypes.string.isRequired
            }).isRequired
          ).isRequired
        }).isRequired
      ).isRequired
    }).isRequired
  ).isRequired
};

export default Resolved;
