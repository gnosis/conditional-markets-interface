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
  positions,
  collateral,
  assumptions,
  selectedOutcomes,

  predictionProbabilities,
  outcomeTokenBuyAmounts,
  stagedPositions,

  validPosition,
  allowanceAvailable,
  invest,
  buyError,
  isBuying,

  selectedSell,
  selectedSellAmount,
  predictedSellProfit,

  handleSelectAssumption,
  handleSelectOutcome,
  handleSelectInvest,

  handleSetAllowance,
  handleBuyOutcomes,

  handleSelectSell,
  handleSelectSellAmount,

  handleSellPosition
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
          handleSellPosition={handleSellPosition}
          collateral={collateral}
          handleSelectSell={handleSelectSell}
          handleSelectSellAmount={handleSelectSellAmount}
          selectedSellAmount={selectedSellAmount}
          selectedSell={selectedSell}
          predictedSellProfit={predictedSellProfit}
        />
      </section>
    </div>
  );
}

Page.propTypes = {
  markets: PropTypes.any.isRequired,
  positions: PropTypes.any.isRequired,
  collateral: PropTypes.any.isRequired,
  assumptions: PropTypes.any.isRequired,
  selectedOutcomes: PropTypes.any.isRequired,

  predictionProbabilities: PropTypes.any.isRequired,
  outcomeTokenBuyAmounts: PropTypes.any.isRequired,
  stagedPositions: PropTypes.any.isRequired,

  validPosition: PropTypes.any.isRequired,
  allowanceAvailable: PropTypes.string.isRequired,
  invest: PropTypes.any.isRequired,
  buyError: PropTypes.any.isRequired,
  isBuying: PropTypes.any.isRequired,

  selectedSell: PropTypes.any.isRequired,
  selectedSellAmount: PropTypes.any.isRequired,
  predictedSellProfit: PropTypes.any.isRequired,

  handleSelectAssumption: PropTypes.any.isRequired,
  handleSelectOutcome: PropTypes.any.isRequired,
  handleSelectInvest: PropTypes.any.isRequired,

  handleSetAllowance: PropTypes.any.isRequired,
  handleBuyOutcomes: PropTypes.any.isRequired,

  handleSelectSell: PropTypes.any.isRequired,
  handleSelectSellAmount: PropTypes.any.isRequired,

  handleSellPosition: PropTypes.any.isRequired
};

export default Page;
