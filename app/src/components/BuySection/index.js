import React from "react";
import classnames from "classnames/bind";
import Decimal from "decimal.js";
import Spinner from "components/Spinner";

import style from "./style.scss";

const cx = classnames.bind(style);

const BuySection = ({
  handleBuyOutcomes,
  handleSelectInvest,
  invest,
  selectionPrice,
  validPosition,
  outcomeTokenBuyAmounts,
  isBuying,
  buyError,
  collateral
}) => (
  <div className={cx("positions")}>
    <input
      type="text"
      placeholder={`Your Invest in ${collateral.name}`}
      value={invest}
      onChange={handleSelectInvest}
    />
    <button
      type="button"
      disabled={!validPosition || isBuying || buyError !== false}
      onClick={handleBuyOutcomes}
    >
      {isBuying ? <Spinner centered inverted width={25} height={25} /> : "Buy"}
    </button>
    {buyError && <span className={cx("error")}>{buyError === true ? "An error has occured" : buyError}</span>}
  </div>
);

BuySection.defaultProps = {
  invest: "",
  selectionPrice: 0,
  outcomeTokenBuyAmounts: [],
  isBuying: false,
  buyError: ""
};

export default BuySection;
