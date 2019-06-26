import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import Decimal from "decimal.js-light";
import PositionGroupDetails from "./position-group-details";
import Spinner from "./spinner";
import { maxUint256BN, zeroDecimal } from "../utils/constants";
import { formatCollateral } from "../utils/formatting";
import { calcPositionGroups } from "../utils/position-groups";

import cn from "classnames";

const { BN } = Web3.utils;

function calcOutcomeTokenCounts(
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

  let refundedTerm = zeroDecimal;
  let takenTerm = zeroDecimal;
  let refusedTerm = zeroDecimal;
  positions.forEach(({ positionIndex, outcomes }) => {
    const balance = positionBalances[positionIndex].toString();
    if (
      outcomes.some(
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
      positionTypes[positionIndex] = "refunded";
    } else if (
      outcomes.every(
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
      positionTypes[positionIndex] = "taken";
    } else {
      refusedTerm = refusedTerm.add(
        invB
          .mul(balance)
          .neg()
          .exp()
      );
      positionTypes[positionIndex] = "refused";
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
    if (type === "refused") return zeroDecimal;
    throw new Error(`Position types [${positionTypes.join(", ")}] invalid`);
  });
}

const BuySection = ({
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
            placeholder={`Investment amount in ${collateral.name}`}
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

BuySection.propTypes = {
  account: PropTypes.string.isRequired,
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
      positionIndex: PropTypes.number.isRequired,
      outcomes: PropTypes.arrayOf(
        PropTypes.shape({
          marketIndex: PropTypes.number.isRequired,
          outcomeIndex: PropTypes.number.isRequired
        }).isRequired
      ).isRequired
    }).isRequired
  ).isRequired,
  collateral: PropTypes.shape({
    contract: PropTypes.object.isRequired,
    name: PropTypes.string.isRequired,
    symbol: PropTypes.string.isRequired,
    decimals: PropTypes.number.isRequired,
    isWETH: PropTypes.bool.isRequired
  }).isRequired,
  collateralBalance: PropTypes.shape({
    amount: PropTypes.instanceOf(BN).isRequired,
    unwrappedAmount: PropTypes.instanceOf(BN),
    totalAmount: PropTypes.instanceOf(BN).isRequired
  }),
  lmsrMarketMaker: PropTypes.object.isRequired,
  lmsrState: PropTypes.shape({
    funding: PropTypes.instanceOf(BN).isRequired,
    positionBalances: PropTypes.arrayOf(PropTypes.instanceOf(BN).isRequired)
      .isRequired,
    stage: PropTypes.string.isRequired
  }),
  lmsrAllowance: PropTypes.instanceOf(BN),
  marketSelections: PropTypes.arrayOf(
    PropTypes.shape({
      isAssumed: PropTypes.bool.isRequired,
      selectedOutcomeIndex: PropTypes.number
    }).isRequired
  ),
  stagedTradeAmounts: PropTypes.arrayOf(
    PropTypes.instanceOf(Decimal).isRequired
  ),
  setStagedTradeAmounts: PropTypes.func.isRequired,
  stagedTransactionType: PropTypes.string,
  setStagedTransactionType: PropTypes.func.isRequired,
  ongoingTransactionType: PropTypes.string,
  asWrappedTransaction: PropTypes.func.isRequired
};

export default BuySection;
