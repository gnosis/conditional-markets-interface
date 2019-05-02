import React from "react";
import PropTypes from "prop-types";
import Decimal from "decimal.js";

import { arrayToHumanReadableList } from "./utils/list";
import { formatFromWei, pseudoMarkdown } from "./utils/formatting";

import cn from "classnames";

const YourPositions = ({
  positions,
  collateral,

  selectedSell,
  selectedSellAmount,
  predictedSellProfit,

  handleSelectSell,
  handleSellPosition,
  handleSelectSellAmount
}) => (
  <div className={cn("your-positions")}>
    <h2>Positions</h2>
    {!positions.length && <em>{"You don't hold any positions yet."}</em>}
    {positions.map((position, index) => {
      const empty = selectedSellAmount === "";
      const validNum =
        !isNaN(parseFloat(selectedSellAmount)) &&
        selectedSellAmount > 0 &&
        isFinite(selectedSellAmount);
      const sellAmountLowerThanBalance =
        validNum &&
        !empty &&
        new Decimal(position.value)
          .dividedBy(new Decimal(10).pow(18))
          .gte(new Decimal(selectedSellAmount));
      const canSellThisPosition =
        selectedSell === position.outcomeIds &&
        validNum &&
        sellAmountLowerThanBalance;

      let sellErrorReason;

      if (!validNum) {
        sellErrorReason = "Please enter a valid amount of token to sell";
      } else if (!sellAmountLowerThanBalance) {
        sellErrorReason = "You can't sell more than you own of this token";
      } else {
        sellErrorReason = "Sorry, an error occurred. Please try again later";
      }

      if (position.value == "0") return null;

      return (
        <div key={index} className={cn("position")}>
          <div className={cn("row", "details")}>
            <div className={cn("value")}>
              <strong>
                {formatFromWei(position.value, collateral.symbol)}
              </strong>
              &nbsp;
            </div>
            <div className={cn("description")}>
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
            <div className={cn("controls")}>
              <button
                type="button"
                onClick={() => handleSelectSell(position.outcomeIds)}
              >
                Sell
              </button>
            </div>
          </div>
          {selectedSell === position.outcomeIds && (
            <div className={cn("row", "sell")}>
              <p>
                You can sell a maximum amount of{" "}
                {formatFromWei(position.value, "Tokens")} of this position.
              </p>
              <div className={cn("controls")}>
                <input
                  type="text"
                  value={selectedSellAmount}
                  placeholder="Amount of tokens to sell"
                  onChange={handleSelectSellAmount}
                />
                <button
                  type="button"
                  onClick={() =>
                    handleSelectSellAmount(
                      new Decimal(position.value)
                        .dividedBy(new Decimal(10).pow(18))
                        .toString()
                    )
                  }
                >
                  Max Amount
                </button>
                <button
                  type="button"
                  disabled={!canSellThisPosition}
                  onClick={() =>
                    handleSellPosition(
                      position.outcomes,
                      new Decimal(selectedSellAmount)
                        .mul(new Decimal(10).pow(18))
                        .toString()
                    )
                  }
                >
                  Confirm
                </button>
              </div>
              <div className={cn("row", "messages")}>
                <>
                  {predictedSellProfit && predictedSellProfit > 0 && (
                    <span>
                      Estimated earnings from sale:{" "}
                      {formatFromWei(predictedSellProfit, collateral.symbol)}
                    </span>
                  )}
                </>
                <>
                  {!empty && !canSellThisPosition && (
                    <span className={cn("error")}>{sellErrorReason}</span>
                  )}
                </>
              </div>
            </div>
          )}
        </div>
      );
    })}
  </div>
);

YourPositions.propTypes = {
  positions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      outcomeIds: PropTypes.string.isRequired,
      markets: PropTypes.arrayOf(
        PropTypes.shape({
          isResolved: PropTypes.bool.isRequired,
          result: PropTypes.number.isRequired,
          selectedOutcome: PropTypes.number.isRequired,
          when: PropTypes.string.isRequired,
          whenNot: PropTypes.string.isRequired
        }).isRequired
      ).isRequired
    }).isRequired
  ).isRequired,
  collateral: PropTypes.shape({
    symbol: PropTypes.string.isRequired
  }).isRequired,

  selectedSell: PropTypes.string,
  selectedSellAmount: PropTypes.string.isRequired,
  predictedSellProfit: PropTypes.instanceOf(Decimal),

  handleSelectSell: PropTypes.func.isRequired,
  handleSellPosition: PropTypes.func.isRequired,
  handleSelectSellAmount: PropTypes.func.isRequired
};

export default YourPositions;
