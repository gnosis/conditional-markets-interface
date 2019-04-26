import React from "react";
import PropTypes from "prop-types";
import css from "./style.scss";

import Markets from "../Markets";
import BuySection from "../BuySection";
import YourPositions from "../YourPositions";

import cn from "classnames/bind";
const cx = cn.bind(css);

function Page({
  markets,
  invest,
  selectedOutcomes,
  handleSellPositions,
  handleSelectOutcome,
  handleBuyOutcomes,
  assumptions,
  handleSelectInvest,
  handleSelectAssumption,
  outcomeTokenBuyAmounts,
  outcomesToBuy,
  selectionPrice,
  validPosition,
  positions,
  stagedPositions,
  predictionProbabilities,
  buyError,
  isBuying,
  redeemError,
  isRedeeming,
  collateral,
  selectedSell,
  handleSelectSell,
  handleSelectSellAmount,
  handleRedeem,
  selectedSellAmount,
  predictedSellProfit,
  allowanceAvailable,
  handleSetAllowance
}) {
  return (
    <div className={cx("page")}>
      <section className={cx("section", "market-section")}>
        <h1 className={cx("page-title")}>Gnosis PM 2.0 Experiments</h1>
        <Markets
          markets={markets}
          handleSelectOutcome={handleSelectOutcome}
          selectedOutcomes={selectedOutcomes}
          assumptions={assumptions}
          handleSelectAssumption={handleSelectAssumption}
          predictionProbabilities={predictionProbabilities}
        />
      </section>
      <div className={cx("seperator")} />
      <section className={cx("section", "position-section")}>
        <h2 className={cx("heading")}>Manage Positions</h2>
        <BuySection
          invest={invest}
          handleSelectInvest={handleSelectInvest}
          selectedOutcomes={selectedOutcomes}
          handleBuyOutcomes={handleBuyOutcomes}
          outcomesToBuy={outcomesToBuy}
          selectionPrice={selectionPrice}
          outcomeTokenBuyAmounts={outcomeTokenBuyAmounts}
          validPosition={validPosition}
          isBuying={isBuying}
          buyError={buyError}
          collateral={collateral}
          stagedPositions={stagedPositions}
          hasAllowance={allowanceAvailable > 0}
          handleSetAllowance={handleSetAllowance}
        />
        <YourPositions
          positions={positions}
          handleSellPosition={handleSellPositions}
          handleRedeem={handleRedeem}
          collateral={collateral}
          handleSelectSell={handleSelectSell}
          handleSelectSellAmount={handleSelectSellAmount}
          selectedSellAmount={selectedSellAmount}
          selectedSell={selectedSell}
          predictedSellProfit={predictedSellProfit}
          redeemError={redeemError}
          isRedeeming={isRedeeming}
        />
      </section>
    </div>
  );
}

Page.propTypes = {
  markets: PropTypes.any.isRequired,
  invest: PropTypes.any,
  selectedOutcomes: PropTypes.any.isRequired,
  handleSellPositions: PropTypes.any.isRequired,
  handleSelectOutcome: PropTypes.any.isRequired,
  handleBuyOutcomes: PropTypes.any.isRequired,
  assumptions: PropTypes.any.isRequired,
  handleSelectInvest: PropTypes.any.isRequired,
  handleSelectAssumption: PropTypes.any.isRequired,
  outcomeTokenBuyAmounts: PropTypes.any.isRequired,
  outcomesToBuy: PropTypes.any.isRequired,
  selectionPrice: PropTypes.any.isRequired,
  validPosition: PropTypes.any.isRequired,
  positions: PropTypes.any.isRequired,
  stagedPositions: PropTypes.any.isRequired,
  predictionProbabilities: PropTypes.any.isRequired,
  buyError: PropTypes.any.isRequired,
  isBuying: PropTypes.any.isRequired,
  redeemError: PropTypes.any.isRequired,
  isRedeeming: PropTypes.any.isRequired,
  collateral: PropTypes.any.isRequired,
  selectedSell: PropTypes.any,
  handleSelectSell: PropTypes.any,
  handleSelectSellAmount: PropTypes.any.isRequired,
  handleRedeem: PropTypes.any.isRequired,
  selectedSellAmount: PropTypes.any,
  predictedSellProfit: PropTypes.any,
  allowanceAvailable: PropTypes.string.isRequired,
  handleSetAllowance: PropTypes.any.isRequired
};

Page.defaultProps = {
  markets: {},
  investments: {}
};

export default Page;
