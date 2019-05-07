import React from "react";
import PropTypes from "prop-types";
import Decimal from "decimal.js-light";
import PositionGroupDetails from "./position-group-details";
import Spinner from "./spinner";
import { formatCollateral } from "./utils/formatting";
import { calcPositionGroups } from "./utils/position-groups";

import cn from "classnames";

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

  const positionGroups =
    positionBalances &&
    calcPositionGroups(markets, positions, positionBalances);

  return (
    <div className={cn("your-positions")}>
      <h2>Positions</h2>
      {positionGroups == null ? (
        <Spinner width={25} height={25} />
      ) : positionGroups.length === 0 ? (
        <em>{"You don't hold any positions yet."}</em>
      ) : (
        positionGroups.map((positionGroup, index) => {
          const empty = null;
          const canSellThisPosition = null;

          const sellErrorReason = null;

          return (
            <div key={index} className={cn("position")}>
              <div className={cn("row", "details")}>
                <PositionGroupDetails
                  {...{
                    positionGroup,
                    collateral
                  }}
                />
                <div className={cn("controls")}>
                  <button
                    type="button"
                    onClick={() => handleSelectSell(positionGroup.outcomeIds)}
                  >
                    Sell
                  </button>
                </div>
              </div>
              {selectedSell === positionGroup.outcomeIds && (
                <div className={cn("row", "sell")}>
                  <p>
                    You can sell a maximum amount of{" "}
                    {formatCollateral(positionGroup.value, collateral)} of this
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
                          new Decimal(positionGroup.value)
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
                          positionGroup.outcomes,
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
