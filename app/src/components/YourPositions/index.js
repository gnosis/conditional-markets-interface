import React from "react";
import Decimal from "decimal.js";
import cn from "classnames/bind";

import { arrayToHumanReadableList } from "./utils/list";
import { formatFromWei, pseudoMarkdown } from "./utils/formatting";

import style from "./style.scss";

const cx = cn.bind(style);

const YourPositions = ({
  positions,
  handleSelectSell,
  handleSellPosition,
  selectedSellAmount,
  handleSelectSellAmount,
  collateral,
  selectedSell,
  predictedSellProfit
}) => (
  <div className={cx("your-positions")}>
    <h2>Positions</h2>
    {!positions.length && <em>You don't hold any positions yet.</em>}
    {positions.map((position, index) => {
      const empty = selectedSellAmount === ""
      const validNum = !isNaN(parseFloat(selectedSellAmount)) && selectedSellAmount > 0 && isFinite(selectedSellAmount)
      const sellAmountLowerThanBalance = validNum && !empty && new Decimal(position.value).dividedBy(new Decimal(10).pow(18)).gte(new Decimal(selectedSellAmount))
      const canSellThisPosition = selectedSell === position.outcomeIds && validNum && sellAmountLowerThanBalance
      let sellErrorReason

       if (!validNum) {
        sellErrorReason = "Please enter a valid amount of token to sell"
      } else if (!sellAmountLowerThanBalance) {
        sellErrorReason = "You can't sell more than you own of this token"
      } else {
        sellErrorReason = "Sorry, an error occoured. Please try again later"
      }

      return (
        <div key={index} className={cx("position")}>
          <div className={cx("row", "details")}>
            <div className={cx("value")}>
              <strong>{formatFromWei(position.value, collateral.symbol)}</strong>
              &nbsp;
            </div>
            <div className={cx("description")}>
              {position.outcomeIds === "" ? (
                position.value > 0 && <span>In any Case</span>
              ) : (
                <span>
                  when{" "}
                  {arrayToHumanReadableList(
                    position.markets.map(market =>
                      market.selectedOutcome === 0
                        ? pseudoMarkdown(market.when)
                        : pseudoMarkdown(market.whenNot)
                    )
                  )}
                </span>
              )}
            </div>
            <div className={cx("controls")}>
              <button
                type="button"
                onClick={() => handleSelectSell(position.outcomeIds)}
              >
                Sell
              </button>
            </div>
          </div>
          {selectedSell === position.outcomeIds && (
            <div className={cx("row", "sell")}>
              <p>
                You can sell a maximum amount of{" "}
                {formatFromWei(position.value, "Tokens")} of this position.
              </p>
              <div className={cx("controls")}>
                <input
                  type="text"
                  value={selectedSellAmount}
                  placeholder="Amount of tokens to sell"
                  onChange={handleSelectSellAmount}
                />
                <button
                type="button"
                onClick={() => handleSelectSellAmount(new Decimal(position.value).dividedBy(new Decimal(10).pow(18)).toString())}
                >
                  Max Amount
                </button>
                <button
                  type="button"
                  disabled={!canSellThisPosition}
                  onClick={() => handleSellPosition(position.outcomes, new Decimal(selectedSellAmount).mul(new Decimal(10).pow(18)).toString())}
                >
                  Confirm
                </button>
              </div>
              <div className={cx("row", "messages")}>  
                <>
                  {predictedSellProfit && predictedSellProfit > 0 && <span>Estimated earnings from sale: {formatFromWei(predictedSellProfit, collateral.symbol)}</span>}
                </>
                <>
                  {!empty && !canSellThisPosition && <span className={cx("error")}>{sellErrorReason}</span>}
                </>
              </div>
            </div>
          )}
        </div>
      )
    })}
  </div>
);

YourPositions.defaultProps = {
  selectedSellAmount: ""
};

export default YourPositions;
