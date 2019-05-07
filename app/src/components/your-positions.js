import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Decimal from "decimal.js-light";
import PositionGroupDetails from "./position-group-details";
import Spinner from "./spinner";
import { formatCollateral } from "./utils/formatting";
import { calcPositionGroups } from "./utils/position-groups";

import cn from "classnames";

const YourPositions = ({
  account,
  pmSystem,
  markets,
  positions,
  collateral,
  lmsrMarketMaker,
  positionBalances,
  stagedTradeAmounts,
  setStagedTradeAmounts,
  stagedTransactionType,
  setStagedTransactionType,
  ongoingTransactionType,
  asWrappedTransaction
}) => {
  const [salePositionGroup, setSalePositionGroup] = useState(null);

  const [saleAmount, setSaleAmount] = useState("");

  const [error, setError] = useState(null);

  useEffect(() => {
    if (saleAmount === "") {
      setStagedTradeAmounts(null);
      setStagedTransactionType("sell outcome tokens");
      setError(null);
      return;
    }

    try {
      const saleAmountInUnits = new Decimal(10)
        .pow(collateral.decimals)
        .mul(saleAmount);

      if (!saleAmountInUnits.isInteger())
        throw new Error(
          `Got more than ${collateral.decimals} decimals in value ${saleAmount}`
        );

      if (saleAmountInUnits.gt(salePositionGroup.amount.toString()))
        throw new Error(
          `Not enough collateral: missing ${formatCollateral(
            saleAmountInUnits.sub(salePositionGroup.amount.toString()),
            collateral
          )}`
        );

      setStagedTradeAmounts(
        Array.from({ length: positions.length }, (_, i) =>
          salePositionGroup.positions.find(
            ({ positionIndex }) => positionIndex === i
          ) == null
            ? new Decimal(0)
            : saleAmountInUnits.neg()
        )
      );
      setError(null);
    } catch (e) {
      setStagedTradeAmounts(null);
      setError(e);
    } finally {
      setStagedTransactionType("sell outcome tokens");
    }
  }, [collateral, positions, salePositionGroup, saleAmount]);

  const predictedSellProfit = null;

  const positionGroups =
    positionBalances &&
    calcPositionGroups(markets, positions, positionBalances);

  async function sellOutcomeTokens() {
    if (stagedTradeAmounts == null) throw new Error(`No sell set yet`);

    if (stagedTransactionType !== "sell outcome tokens")
      throw new Error(
        `Can't sell outcome tokens while staged transaction is to ${stagedTransactionType}`
      );

    if (!(await pmSystem.isApprovedForAll(account, lmsrMarketMaker.address))) {
      await pmSystem.setApprovalForAll(lmsrMarketMaker.address, true, {
        from: account
      });
    }

    const tradeAmounts = stagedTradeAmounts.map(amount => amount.toString());
    const collateralLimit = await lmsrMarketMaker.calcNetCost(tradeAmounts);

    await lmsrMarketMaker.trade(tradeAmounts, collateralLimit, {
      from: account
    });
  }

  return (
    <div className={cn("your-positions")}>
      <h2>Positions</h2>
      {positionGroups == null ? (
        <Spinner width={25} height={25} />
      ) : positionGroups.length === 0 ? (
        <em>{"You don't hold any positions yet."}</em>
      ) : (
        positionGroups.map(positionGroup => {
          const isSalePositionGroup =
            salePositionGroup != null &&
            salePositionGroup.collectionId === positionGroup.collectionId;

          return (
            <div key={positionGroup.collectionId} className={cn("position")}>
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
                    onClick={() => {
                      setSalePositionGroup(
                        isSalePositionGroup ? null : positionGroup
                      );
                      setSaleAmount("");
                    }}
                  >
                    Sell
                  </button>
                </div>
              </div>
              {isSalePositionGroup && (
                <div className={cn("row", "sell")}>
                  <p>
                    You can sell a maximum amount of{" "}
                    {formatCollateral(positionGroup.amount, collateral)} of this
                    position.
                  </p>
                  <div className={cn("controls")}>
                    <input
                      type="text"
                      value={saleAmount}
                      placeholder="Amount of tokens to sell"
                      onChange={e => {
                        setSaleAmount(e.target.value);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSaleAmount(
                          new Decimal(10)
                            .pow(-collateral.decimals)
                            .mul(positionGroup.amount.toString())
                            .toFixed()
                        );
                      }}
                    >
                      Max Amount
                    </button>
                    <button
                      type="button"
                      disabled={
                        stagedTradeAmounts == null ||
                        ongoingTransactionType != null ||
                        error != null
                      }
                      onClick={asWrappedTransaction(
                        "sell outcome tokens",
                        sellOutcomeTokens,
                        setError
                      )}
                    >
                      {ongoingTransactionType === "sell outcome tokens" ? (
                        <Spinner inverted width={25} height={25} />
                      ) : (
                        <>Confirm</>
                      )}
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
                    {error != null && (
                      <span className={cn("error")}>{error.message}</span>
                    )}
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

  predictedSellProfit: PropTypes.instanceOf(Decimal),

  handleSellPosition: PropTypes.func.isRequired,
  handleSelectSellAmount: PropTypes.func.isRequired
};

export default YourPositions;
