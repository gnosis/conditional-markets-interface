import React from "react";
import PropTypes from "prop-types";
import css from "./style.scss";
//import Market from '../Market'

import Markets from "../Markets";
import MarketAssumptions from "../MarketAssumptions";

import cn from "classnames/bind";
const cx = cn.bind(css);

function Page({
  markets,
  invest,
  selectedOutcomes,
  selectOutcomes,
  unlockPredictions,
  handleBuyOutcomes,
  sellOutcomes,
  unlockedPredictions,
  assumptions,
  handleSelectInvest,
  handleSelectAssumption,
  handleSellOutcomes
}) {
  return (
    <div className={cx("page")}>
      <section>
        <h1 className={cx("heading")}>PM 2.0 Experiments</h1>
        <h2>
          1. Determine under which circumstances you want to make your
          predictions
        </h2>
        <p>
          To benefit of a liquidation pool for all markets below, the following
          choices affect which outcome pairs you can give the most accurate
          prediction on.
        </p>

        <MarketAssumptions
          markets={markets}
          assumptions={assumptions}
          onSelectAssumption={handleSelectAssumption}
        />

        {!unlockedPredictions && (
          <button
            className={cx("unlockPredictions")}
            onClick={unlockPredictions}
            type="button"
          >
            Continue
          </button>
        )}
      </section>
      <section>
        <div
          className={cx("lockedOverlay", {
            lockedOverlayEnabled: !unlockedPredictions
          })}
        >
          <span>Please make a selection in the above section</span>
        </div>

        <h2>2. Choose your predictions</h2>
        <p>Please enter the amount of tokens you wish to buy below</p>
        <input
          type="text"
          className={cx("invest")}
          placeholder="How many tokens do you wish to buy from the Market Maker?"
          value={invest}
          onChange={handleSelectInvest}
        />

        <Markets
          markets={markets}
          selectOutcomes={selectOutcomes}
          selectedOutcomes={selectedOutcomes}
          assumptions={assumptions}
        />

        <button
          className={cx("buyOutcomes")}
          onClick={handleBuyOutcomes}
          type="button"
          disabled={!invest}
        >
          Buy Selected Outcomes
        </button>
        <button
          className={cx("sellOutcomes")}
          onClick={handleSellOutcomes}
          type="button"
        >
          Sell Selected Outcomes
        </button>
      </section>
    </div>
  );
}

Page.propTypes = {
  loading: PropTypes.string.isRequired,
  markets: PropTypes.arrayOf(PropTypes.shape)
};

Page.defaultProps = {
  markets: {},
  invest: ""
};

export default Page;
