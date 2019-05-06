import React from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import Decimal from "decimal.js-light";

import { product, combinations } from "./utils/itertools";
import { formatCollateral } from "./utils/formatting";

import cn from "classnames";

const maxUint256 = Web3.utils.toBN(`0x${"ff".repeat(32)}`);

function calcPositionGroups(markets, positions, positionAmounts) {
  const positionGroups = [];

  let runningPositionAmounts = positionAmounts.slice();

  for (let numMarkets = 0; numMarkets <= markets.length; ++numMarkets) {
    for (const outcomesTuples of combinations(
      markets.map(({ outcomes }) => outcomes),
      numMarkets
    )) {
      for (const outcomeSet of product(...outcomesTuples)) {
        const groupPositions = outcomeSet.reduce(
          (positionsIntersection, { positions: outcomePositions }) =>
            positionsIntersection.filter(
              ({ id }) =>
                outcomePositions.find(({ id: otherId }) => id === otherId) !=
                null
            ),
          positions
        );

        const [groupAmount] = groupPositions.reduce(
          ([acc], { positionIndex }) => [
            acc.lte(runningPositionAmounts[positionIndex])
              ? acc
              : runningPositionAmounts[positionIndex]
          ],
          [maxUint256]
        );

        if (groupAmount.gtn(0)) {
          positionGroups.push({
            outcomeSet,
            amount: groupAmount,
            positions: groupPositions
          });

          for (const { positionIndex } of groupPositions) {
            runningPositionAmounts[positionIndex] = runningPositionAmounts[
              positionIndex
            ].sub(groupAmount);
          }
        }
      }
    }
  }

  return positionGroups;
}

const YourPositions = ({
  markets,
  positions,
  collateral,
  positionBalances
}) => {
  const selectedSell = null;
  const selectedSellAmount = null;
  const predictedSellProfit = null;
  const handleSelectSell = null;
  const handleSellPosition = null;
  const handleSelectSellAmount = null;

  // const positionGroups =
  positionBalances && calcPositionGroups(markets, positions, positionBalances);

  return (
    <div className={cn("your-positions")}>
      <h2>Positions</h2>
      {positions.length === 0 ? (
        <em>{"You don't hold any positions yet."}</em>
      ) : (
        positions.map((position, index) => {
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
            sellErrorReason =
              "Sorry, an error occurred. Please try again later";
          }

          if (position.value == "0") return null;

          return (
            <div key={index} className={cn("position")}>
              <div className={cn("row", "details")}>
                <div className={cn("value")}>
                  <strong>
                    {formatCollateral(position.value, collateral)}
                  </strong>
                  &nbsp;
                </div>
                <div className={cn("description")}>
                  {position.outcomeIds === "" ? (
                    position.value > 0 && <span>In any Case</span>
                  ) : (
                    <span>
                      when{" "}
                      {
                        // stub
                      }
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
                    {formatCollateral(position.value, collateral)} of this
                    position.
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
                          {formatCollateral(predictedSellProfit, collateral)}
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
        })
      )}
    </div>
  );
};

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
