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
  investments,
  selectedOutcomes,
  handleSelectOutcome,
  unlockPredictions,
  handleBuyOutcomes,
  sellOutcomes,
  unlockedPredictions,
  assumptions,
  handleSelectInvest,
  handleSelectAssumption,
  handleSellOutcomes,
  handleSelectSell,
  handleSellOutcome,
  sellAmounts
}) {
  return (
    <div className={cx("page")}>
      <section className={cx("page-section")}>
        <h1 className={cx("heading")}>PM 2.0 Experiments</h1>
        <Markets
          markets={markets}
          handleSelectOutcome={handleSelectOutcome}
          selectedOutcomes={selectedOutcomes}
          assumptions={assumptions}
          handleSelectSell={handleSelectSell}
          sellAmounts={sellAmounts}
          handleSelectInvest={handleSelectInvest}
          handleBuyOutcomes={handleBuyOutcomes}
          handleSellOutcome={handleSellOutcome}
          handleSelectAssumption={handleSelectAssumption}
          investments={investments}
        />
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
  investments: {}
};

export default Page;
