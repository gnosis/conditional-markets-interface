import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import Decimal from "decimal.js-light";
import PositionGroupDetails from "./position-group-details";
import Spinner from "./spinner";
import { formatCollateral } from "./utils/formatting";
import { calcPositionGroups } from "./utils/position-groups";

import cn from "classnames";

const { BN } = Web3.utils;

function calcNetCost({ funding, positionBalances }, tradeAmounts) {
  const invB = new Decimal(positionBalances.length)
    .ln()
    .dividedBy(funding.toString());
  return tradeAmounts
    .reduce(
      (acc, tradeAmount, i) =>
        acc.add(
          tradeAmount
            .sub(positionBalances[i].toString())
            .mul(invB)
            .exp()
        ),
      new Decimal(0)
    )
    .ln()
    .div(invB);
}

const YourPositions = ({
  account,
  pmSystem,
  markets,
  positions,
  collateral,
  lmsrMarketMaker,
  lmsrState,
  positionBalances,
  stagedTradeAmounts,
  setStagedTradeAmounts,
  stagedTransactionType,
  setStagedTransactionType,
  ongoingTransactionType,
  asWrappedTransaction
}) => {
  const [positionGroups, setPositionGroups] = useState(null);

  useEffect(() => {
    if (positionBalances == null) {
      setPositionGroups(null);
    } else {
      const positionGroups = calcPositionGroups(
        markets,
        positions,
        positionBalances
      );
      setPositionGroups(positionGroups);
    }
  }, [markets, positions, positionBalances]);

  const [salePositionGroup, setSalePositionGroup] = useState(null);

  useEffect(() => {
    if (positionGroups == null) {
      setSalePositionGroup(null);
    } else if (salePositionGroup != null) {
      setSalePositionGroup(
        positionGroups.find(
          ({ collectionId }) => collectionId === salePositionGroup.collectionId
        )
      );
    }
  }, [positionGroups]);

  const [saleAmount, setSaleAmount] = useState("");
  const [estimatedSaleEarnings, setEstimatedSaleEarnings] = useState(null);

  const [error, setError] = useState(null);

  useEffect(() => {
    if (saleAmount === "") {
      setStagedTradeAmounts(null);
      setEstimatedSaleEarnings(null);
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

      const stagedTradeAmounts = Array.from(
        { length: positions.length },
        (_, i) =>
          salePositionGroup.positions.find(
            ({ positionIndex }) => positionIndex === i
          ) == null
            ? new Decimal(0)
            : saleAmountInUnits.neg()
      );

      setStagedTradeAmounts(stagedTradeAmounts);

      setEstimatedSaleEarnings(
        calcNetCost(lmsrState, stagedTradeAmounts).neg()
      );

      setError(null);
    } catch (e) {
      setStagedTradeAmounts(null);
      setEstimatedSaleEarnings(null);
      setError(e);
    } finally {
      setStagedTransactionType("sell outcome tokens");
    }
  }, [collateral, positions, lmsrState, salePositionGroup, saleAmount]);

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
                        stagedTransactionType !== "sell outcome tokens" ||
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
                      {estimatedSaleEarnings && estimatedSaleEarnings > 0 && (
                        <span>
                          Estimated earnings from sale:{" "}
                          {formatCollateral(estimatedSaleEarnings, collateral)}
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
  account: PropTypes.string.isRequired,
  pmSystem: PropTypes.object.isRequired,
  markets: PropTypes.arrayOf(
    PropTypes.shape({
      outcomes: PropTypes.arrayOf(
        PropTypes.shape({
          positions: PropTypes.arrayOf(
            PropTypes.shape({
              id: PropTypes.string.isRequired
            }).isRequired
          ).isRequired
        }).isRequired
      ).isRequired
    }).isRequired
  ).isRequired,
  positions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      positionIndex: PropTypes.number.isRequired
    }).isRequired
  ).isRequired,
  collateral: PropTypes.shape({
    symbol: PropTypes.string.isRequired,
    decimals: PropTypes.number.isRequired
  }).isRequired,
  lmsrMarketMaker: PropTypes.object.isRequired,
  lmsrState: PropTypes.shape({
    funding: PropTypes.instanceOf(BN).isRequired,
    positionBalances: PropTypes.arrayOf(PropTypes.instanceOf(BN).isRequired)
      .isRequired
  }),
  positionBalances: PropTypes.arrayOf(PropTypes.instanceOf(BN).isRequired),
  stagedTradeAmounts: PropTypes.arrayOf(
    PropTypes.instanceOf(Decimal).isRequired
  ),
  setStagedTradeAmounts: PropTypes.func.isRequired,
  stagedTransactionType: PropTypes.string,
  setStagedTransactionType: PropTypes.func.isRequired,
  ongoingTransactionType: PropTypes.string,
  asWrappedTransaction: PropTypes.func.isRequired
};

export default YourPositions;
