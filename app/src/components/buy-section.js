import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import Decimal from "decimal.js-light";
import Spinner from "./spinner";

import { arrayToHumanReadableList } from "./utils/list";
import { formatCollateral, pseudoMarkdown } from "./utils/formatting";

import cn from "classnames";

const { toBN } = Web3.utils;

const maxUint256 = toBN(`0x${"ff".repeat(32)}`);

function asWrappedTransaction(
  wrappedTransactionType,
  transactionFn,
  { ongoingTransactionType, setOngoingTransactionType, setError, triggerSync }
) {
  return async function wrappedAction() {
    if (ongoingTransactionType != null) {
      throw new Error(
        `Attempted to ${wrappedTransactionType} while transaction to ${ongoingTransactionType} is ongoing`
      );
    }

    try {
      setOngoingTransactionType(wrappedTransactionType);
      await transactionFn();
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setOngoingTransactionType(null);
      triggerSync();
    }
  };
}

function calcOutcomeTokenCounts(
  markets,
  positions,
  { funding, positionBalances },
  amount,
  marketSelections
) {
  if (
    marketSelections.every(
      ({ isAssumed, selectedOutcomeIndex }) =>
        isAssumed || selectedOutcomeIndex == null
    )
  )
    throw new Error("At least one outcome selection must be made");

  const invB = new Decimal(positions.length).ln().dividedBy(funding.toString());

  const positionTypes = new Array(positions.length).fill(null);

  const zero = new Decimal(0);
  let refundedTerm = zero;
  let takenTerm = zero;
  let refusedTerm = zero;
  positions.forEach(position => {
    const balance = positionBalances[position.positionIndex].toString();
    if (
      position.outcomes.some(
        ({ marketIndex, outcomeIndex }) =>
          marketSelections[marketIndex].isAssumed &&
          outcomeIndex !== marketSelections[marketIndex].selectedOutcomeIndex
      )
    ) {
      refundedTerm = refundedTerm.add(
        amount
          .sub(balance)
          .mul(invB)
          .exp()
      );
      positionTypes[position.positionIndex] = "refunded";
    } else if (
      position.outcomes.every(
        ({ marketIndex, outcomeIndex }) =>
          marketSelections[marketIndex].selectedOutcomeIndex == null ||
          outcomeIndex === marketSelections[marketIndex].selectedOutcomeIndex
      )
    ) {
      takenTerm = takenTerm.add(
        invB
          .mul(balance)
          .neg()
          .exp()
      );
      positionTypes[position.positionIndex] = "taken";
    } else {
      refusedTerm = refusedTerm.add(
        invB
          .mul(balance)
          .neg()
          .exp()
      );
      positionTypes[position.positionIndex] = "refused";
    }
  });

  const takenPositionsAmountEach = amount
    .mul(invB)
    .exp()
    .sub(refundedTerm)
    .sub(refusedTerm)
    .div(takenTerm)
    .ln()
    .div(invB)
    .toInteger();

  return positionTypes.map(type => {
    if (type === "taken") return takenPositionsAmountEach;
    if (type === "refunded") return amount;
    if (type === "refused") return zero;
    throw new Error(`Position types [${positionTypes.join(", ")}] invalid`);
  });
}

const BuySection = ({
  triggerSync,
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
  setOngoingTransactionType
}) => {
  const [investmentAmountHasChanged, setInvestmentAmountHasChanged] = useState(
    false
  );
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [error, setError] = useState(null);
  useEffect(() => {
    if (investmentAmount === "") {
      setStagedTradeAmounts(null);
      if (investmentAmountHasChanged) {
        setStagedTransactionType("buy outcome tokens");
        setError(null);
        setInvestmentAmountHasChanged(false);
      }
      return;
    }
    try {
      const investmentAmountInUnits = new Decimal(10)
        .pow(collateral.decimals)
        .mul(investmentAmount);

      if (!investmentAmountInUnits.isInteger())
        throw new Error(
          `Got more than ${
            collateral.decimals
          } decimals in value ${investmentAmount}`
        );

      setStagedTradeAmounts(
        calcOutcomeTokenCounts(
          markets,
          positions,
          lmsrState,
          investmentAmountInUnits,
          marketSelections
        )
      );
      if (investmentAmountHasChanged) {
        setStagedTransactionType("buy outcome tokens");
        setError(null);
        setInvestmentAmountHasChanged(false);
      }
    } catch (e) {
      setError(e);
    }
  }, [
    markets,
    positions,
    collateral,
    lmsrState,
    investmentAmount,
    marketSelections
  ]);

  let hasEnoughAllowance = false;
  let hasInfiniteAllowance = false;
  if (lmsrAllowance != null)
    try {
      hasEnoughAllowance = new Decimal(10)
        .pow(collateral.decimals)
        .mul(investmentAmount || "0")
        .lte(lmsrAllowance.toString());

      hasInfiniteAllowance = lmsrAllowance.eq(maxUint256);
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

  const validPosition = true;

  async function setAllowance() {
    await collateral.contract.approve(lmsrMarketMaker.address, maxUint256, {
      from: account
    });
  }

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
      {lmsrAllowance != null && (
        <p>{`Market maker allowance: ${
          hasInfiniteAllowance
            ? `∞ ${collateral.symbol}`
            : formatCollateral(lmsrAllowance, collateral)
        }`}</p>
      )}
      <input
        type="text"
        placeholder={`Investment amount in ${collateral.name}`}
        value={investmentAmount}
        onChange={e => {
          setInvestmentAmountHasChanged(true);
          setInvestmentAmount(e.target.value);
        }}
      />
      <button
        type="button"
        disabled={
          stagedTradeAmounts == null ||
          !hasEnoughAllowance ||
          !validPosition ||
          ongoingTransactionType != null ||
          !!error
        }
        onClick={asWrappedTransaction("buy outcome tokens", buyOutcomeTokens, {
          ongoingTransactionType,
          setOngoingTransactionType,
          setError,
          triggerSync
        })}
      >
        {ongoingTransactionType === "buy outcome tokens" ? (
          <Spinner centered inverted width={25} height={25} />
        ) : (
          "Buy"
        )}
      </button>
      {!hasEnoughAllowance && (
        <button
          type="button"
          onClick={asWrappedTransaction("set allowance", setAllowance, {
            ongoingTransactionType,
            setOngoingTransactionType,
            setError,
            triggerSync
          })}
        >
          {ongoingTransactionType === "set allowance" ? (
            <Spinner centered inverted width={25} height={25} />
          ) : (
            "Approve Market Maker for Trades"
          )}
        </button>
      )}
      {error && (
        <span className={cn("error")}>
          {error === true ? "An error has occured" : error.message}
        </span>
      )}

      {validPosition && ongoingTransactionType == null && !error && false && (
        <div>
          <div>You will receive:</div>
          {[].map((position, index) => (
            <div key={index} className={cn("position")}>
              <div className={cn("value")}>
                <strong>
                  {formatCollateral(position.value, collateral.symbol)}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

BuySection.propTypes = {
  collateral: PropTypes.shape({
    name: PropTypes.string.isRequired,
    symbol: PropTypes.string.isRequired
  }).isRequired,
  collateralBalance: PropTypes.shape({
    amount: PropTypes.instanceOf(Decimal).isRequired,
    isWETH: PropTypes.bool,
    unwrappedAmount: PropTypes.string
  }).isRequired,

  stagedPositions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      outcomeIds: PropTypes.string.isRequired,
      markets: PropTypes.arrayOf(
        PropTypes.shape({
          selectedOutcome: PropTypes.number.isRequired,
          when: PropTypes.string.isRequired,
          whenNot: PropTypes.string.isRequired
        }).isRequired
      ).isRequired
    }).isRequired
  ).isRequired,

  validPosition: PropTypes.bool.isRequired,
  hasEnoughAllowance: PropTypes.bool.isRequired,

  handleBuyOutcomes: PropTypes.func.isRequired,
  handleSelectInvest: PropTypes.func.isRequired,
  handleSetAllowance: PropTypes.func.isRequired
};

export default BuySection;
