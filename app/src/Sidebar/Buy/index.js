import React, { useState, useEffect } from "react";

import cn from "classnames/bind";
import style from "./buy.scss";

import Web3 from "web3";
import Decimal from "decimal.js-light";
import PositionGroupDetails from "position-group-details";
import Spinner from "components/Spinner";
import { maxUint256BN, zeroDecimal, outcomeColors } from "utils/constants";
import { formatCollateral } from "utils/formatting";
import { calcPositionGroups } from "utils/position-groups";

const cx = cn.bind(style);

const Buy = ({
  account,
  markets,
  positions,
  collateral,
  collateralBalance,
  lmsrMarketMaker,
  lmsrState,
  lmsrAllowance,
  marketSelections,
  stagedTradeAmounts,
  setStagedTradeAmounts,
  stagedTransactionType,
  setStagedTransactionType,
  ongoingTransactionType,
  asWrappedTransaction
}) => {
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [error, setError] = useState(null);
  useEffect(() => {
    if (stagedTransactionType !== "buy outcome tokens") return;

    if (investmentAmount === "") {
      setStagedTradeAmounts(null);
      setError(null);
      return;
    }
    try {
      const investmentAmountInUnits = collateral.toUnitsMultiplier.mul(
        investmentAmount
      );

      if (!investmentAmountInUnits.isInteger())
        throw new Error(
          `Got more than ${
            collateral.decimals
          } decimals in value ${investmentAmount}`
        );

      if (investmentAmountInUnits.gt(collateralBalance.totalAmount.toString()))
        throw new Error(
          `Not enough collateral: missing ${formatCollateral(
            investmentAmountInUnits.sub(
              collateralBalance.totalAmount.toString()
            ),
            collateral
          )}`
        );

      setStagedTradeAmounts(
        calcOutcomeTokenCounts(
          positions,
          lmsrState,
          investmentAmountInUnits,
          marketSelections
        )
      );
      setError(null);
    } catch (e) {
      setStagedTradeAmounts(null);
      setError(e);
    }
  }, [
    stagedTransactionType,
    positions,
    collateral,
    collateralBalance,
    lmsrState,
    investmentAmount,
    marketSelections
  ]);

  const marketStage = lmsrState && lmsrState.stage;

  let hasAnyAllowance = false;
  let hasEnoughAllowance = false;
  let hasInfiniteAllowance = false;
  if (lmsrAllowance != null)
    try {
      hasAnyAllowance = lmsrAllowance.gtn(0);
      hasEnoughAllowance = collateral.toUnitsMultiplier
        .mul(investmentAmount || "0")
        .lte(lmsrAllowance.toString());

      hasInfiniteAllowance = lmsrAllowance.eq(maxUint256BN);
    } catch (e) {
      // empty
    }

  async function buyOutcomeTokens() {
    if (stagedTradeAmounts == null) throw new Error(`No buy set yet`);

    if (stagedTransactionType !== "buy outcome tokens")
      throw new Error(
        `Can't buy outcome tokens while staged transaction is to ${stagedTransactionType}`
      );

    const tradeAmounts = stagedTradeAmounts.map(amount => amount.toString());
    const collateralLimit = await lmsrMarketMaker.calcNetCost(tradeAmounts);

    if (collateral.isWETH && collateralLimit.gt(collateralBalance.amount)) {
      await collateral.contract.deposit({
        value: collateralLimit.sub(collateralBalance.amount),
        from: account
      });
    }

    await lmsrMarketMaker.trade(tradeAmounts, collateralLimit, {
      from: account
    });
  }

  async function setAllowance() {
    await collateral.contract.approve(lmsrMarketMaker.address, maxUint256BN, {
      from: account
    });
  }

  const [stagedTradePositionGroups, setStagedTradePositionGroups] = useState(
    []
  );
  useEffect(() => {
    setStagedTradePositionGroups(
      stagedTradeAmounts &&
        calcPositionGroups(markets, positions, stagedTradeAmounts)
    );
  }, [markets, positions, stagedTradeAmounts]);

  let investmentAllowed = true;
  let problemText;

  if (!marketStage === "Closed") {
    problemText = "The Market is closed.";
    investmentAllowed = false;
  } else if (!marketSelections) {
    problemText = "Select position(s) first.";
    investmentAllowed = false;
  }

  let humanReadablePositions = {
    payOutWhen: [{ marketIndex: 0, outcome: 0, value: 1e-15, margin: 0.5 }],
    loseInvestmentWhen: [
      { marketIndex: 0, outcome: 1, value: -1e-15, margin: 0.5 }
    ],
    refundWhen: []
  };

  /*
  marketSelections.forEach(({ selectedOutcomeIndex, isAssumed }, index) => {
    positions["payOutWhen"]
  })
  */

  return (
    <>
      <div className={cx("buy-heading")}>
        Order Position(s){" "}
        <button type="button" className={cx("link-button", "clear")}>
          clear all
        </button>
      </div>
      {problemText && <div className={cx("buy-empty")}>{problemText}</div>}
      {investmentAllowed && (
        <>
          <div className={cx("buy-summary")}>
            {humanReadablePositions.payOutWhen && (
              <div className={cx("buy-summary-heading")}>Pay out when</div>
            )}
            {humanReadablePositions.payOutWhen.map(
              ({ marketIndex, outcome, value, margin }) => (
                <div className={cx("summary-entry")}>
                  <div className={cx("entry-outcome")}>
                    <span className={cx("entry-marketindex")}>
                      #{marketIndex + 1}
                    </span>
                    <span className={cx("entry-outcome")}>
                      <i
                        className={cx("dot")}
                        style={{
                          color: outcomeColors[outcome].darken(0.5).toString()
                        }}
                      />{" "}
                      {markets[marketIndex].outcomes[outcome].title}
                    </span>
                  </div>
                  <div className={cx("entry-values")} />
                </div>
              )
            )}
          </div>
          <div className={cx("buy-subheading")}>
            Total Investment ({collateral.name})
          </div>
          <div className={cx("buy-investment")}>
            <button
              className={cx("buy-invest", "buy-invest-minus")}
              type="button"
            >
              -
            </button>
            <div className={cx("input-group")}>
              <button
                type="button"
                className={cx("input-append", "link-button", "invest-max")}
              >
                max
              </button>
              <input
                type="number"
                value={investmentAmount}
                className={cx("input")}
                onChange={e => {
                  setStagedTransactionType("buy outcome tokens");
                  setInvestmentAmount(e.target.value);
                }}
              />
              <span className={cx("input-append", "collateral-name")}>
                {collateral.symbol}
              </span>
            </div>
            <button
              className={cx("buy-invest", "buy-invest-plus")}
              type="button"
            >
              +
            </button>
          </div>
        </>
      )}
      <div className={cx("buy-confirm")}>
        <button className={cx("button")} type="button" disabled>
          Place Order
        </button>
      </div>
    </>
  );

  return (
    <div className={cn("positions")}>
      {collateralBalance != null && (
        <p>{`Your balance: ${formatCollateral(
          collateralBalance.amount,
          collateral
        )}`}</p>
      )}
      {collateralBalance != null && collateral.isWETH && (
        <p>{`Your unwrapped balance: ${formatCollateral(
          collateralBalance.unwrappedAmount,
          collateral
        )}`}</p>
      )}
      {marketStage === "Closed" ? (
        <p>Market maker is closed.</p>
      ) : (
        <>
          {lmsrAllowance != null && (
            <p>{`Market maker allowance: ${
              hasInfiniteAllowance
                ? `∞ ${collateral.symbol}`
                : formatCollateral(lmsrAllowance, collateral)
            }`}</p>
          )}
          <input
            type="text"
            placeholder={`Investment amount in ${collateral &&
              collateral.name}`}
            value={investmentAmount}
            onChange={e => {
              setStagedTransactionType("buy outcome tokens");
              setInvestmentAmount(e.target.value);
            }}
          />
          <button
            type="button"
            disabled={
              !hasEnoughAllowance ||
              stagedTransactionType !== "buy outcome tokens" ||
              stagedTradeAmounts == null ||
              ongoingTransactionType != null ||
              marketStage !== "Running" ||
              error != null
            }
            onClick={asWrappedTransaction(
              "buy outcome tokens",
              buyOutcomeTokens,
              setError
            )}
          >
            {ongoingTransactionType === "buy outcome tokens" ? (
              <Spinner centered inverted width={25} height={25} />
            ) : marketStage === "Paused" ? (
              <>[Market paused]</>
            ) : (
              <>Buy</>
            )}
          </button>
          {((!hasAnyAllowance && stagedTradeAmounts == null) ||
            !hasEnoughAllowance) && (
            <button
              type="button"
              onClick={asWrappedTransaction(
                "set allowance",
                setAllowance,
                setError
              )}
            >
              {ongoingTransactionType === "set allowance" ? (
                <Spinner centered inverted width={25} height={25} />
              ) : (
                "Approve Market Maker for Trades"
              )}
            </button>
          )}
        </>
      )}
      {error && (
        <div className={cn("error")}>
          {error === true ? "An error has occured" : error.message}
        </div>
      )}

      {stagedTradePositionGroups != null && (
        <div>
          <div>You will receive:</div>
          {stagedTradePositionGroups.map(positionGroup => (
            <div key={positionGroup.collectionId} className={cn("position")}>
              <div className={cn("row", "details")}>
                <PositionGroupDetails
                  {...{
                    positionGroup,
                    collateral
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Buy;
