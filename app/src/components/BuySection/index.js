import React from "react";
import classnames from "classnames/bind";
import Decimal from "decimal.js";
import Spinner from "components/Spinner";

import { arrayToHumanReadableList } from "../YourPositions/utils/list";
import { formatFromWei, pseudoMarkdown } from "../YourPositions/utils/formatting";

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
  collateral,
  stagedPositions
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

    {validPosition && !isBuying && !buyError && stagedPositions.length > 0 && <div>
      <div>You will receive:</div>
      {stagedPositions.map((position, index) => (
        <div key={index} className={cx("position")}>
          <div className={cx("value")}><strong>{formatFromWei(position.value, collateral.symbol)}</strong>&nbsp;</div>
          <div className={cx("description")}>
            {position.outcomeIds === "" ? (
              position.value > 0 && (
                <span>In any Case</span>
              )
            ) : (
              <span>
                when{" "}
                {arrayToHumanReadableList(
                  position.markets.map(market => market.selectedOutcome === 0 ? pseudoMarkdown(market.when) : pseudoMarkdown(market.whenNot))
                )}
              </span>
            )}
            </div>
        </div>
    ))}</div>}
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
