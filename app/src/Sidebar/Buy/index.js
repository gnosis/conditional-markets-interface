import React, { Fragment, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Decimal from "decimal.js-light";

import Web3 from "web3";

import cn from "classnames/bind";
import style from "./buy.scss";

import PositionGroupDetails from "position-group-details";
import Spinner from "components/Spinner";
import OutcomeCard from "components/OutcomeCard";
import { zeroDecimal, maxUint256BN } from "utils/constants";
import { formatCollateral } from "utils/formatting";
import {
  calcPositionGroups,
  calcOutcomeTokenCounts
} from "utils/position-groups";

const { BN } = Web3.utils;

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
  const [humanReadablePositions, setHumanReadablePositions] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    //if (stagedTransactionType !== "buy outcome tokens") return;

    let hasEnteredInvestment = false;

    try {
      const decimalInvest = Decimal(investmentAmount);
      hasEnteredInvestment = decimalInvest.gt(0);
    } catch (e) {}

    if (
      !(marketSelections || []).some(
        ({ selectedOutcomeIndex }) => selectedOutcomeIndex > -1
      )
    ) {
      setStagedTradeAmounts(null);
      return;
    }

    //if (investmentAmount === "") {
    //setStagedTradeAmounts(null);
    //setError(null);
    //return;
    //}
    try {
      const investmentAmountInUnits = collateral.toUnitsMultiplier.mul(
        hasEnteredInvestment ? investmentAmount : zeroDecimal
      );

      if (!investmentAmountInUnits.isInteger())
        throw new Error(
          `Got more than ${
            collateral.decimals
          } decimals in value ${investmentAmount}`
        );

      /*
      if (investmentAmountInUnits.gt(collateralBalance.totalAmount.toString()))
        throw new Error(
          `Not enough collateral: missing ${formatCollateral(
            investmentAmountInUnits.sub(
              collateralBalance.totalAmount.toString()
            ),
            collateral
          )}`
        );
      */

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

  const buyOutcomeTokens = useCallback(async () => {
    if (stagedTradeAmounts == null) throw new Error(`No buy set yet`);

    if (stagedTransactionType !== "buy outcome tokens")
      throw new Error(
        `Can't buy outcome tokens while staged transaction is to ${stagedTransactionType}`
      );

    let investmentAmountInUnits;
    try {
      investmentAmountInUnits = collateral.toUnitsMultiplier.mul(
        investmentAmount
      );
    } catch (err) {
      investmentAmountInUnits = zeroDecimal;
    }

    if (investmentAmountInUnits.gt(collateralBalance.totalAmount.toString()))
      throw new Error(
        `Not enough collateral: missing ${formatCollateral(
          investmentAmountInUnits.sub(collateralBalance.totalAmount.toString()),
          collateral
        )}`
      );

    const tradeAmounts = stagedTradeAmounts.map(amount => amount.toString());
    const collateralLimit = await lmsrMarketMaker.calcNetCost(tradeAmounts);

    if (collateral.isWETH && collateralLimit.gt(collateralBalance.amount)) {
      await collateral.contract.deposit({
        value: collateralLimit.sub(collateralBalance.amount),
        from: account
      });
    }

    if (!hasAnyAllowance) {
      await collateral.contract.approve(lmsrMarketMaker.address, maxUint256BN, {
        from: account
      });
    }

    await lmsrMarketMaker.trade(tradeAmounts, collateralLimit, {
      from: account
    });
  }, [
    hasAnyAllowance,
    stagedTransactionType,
    stagedTradeAmounts,
    lmsrMarketMaker,
    collateral,
    account
  ]);

  const setAllowance = useCallback(async () => {
    await collateral.contract.approve(lmsrMarketMaker.address, maxUint256BN, {
      from: account
    });
  }, [collateral, lmsrMarketMaker]);

  const [stagedTradePositionGroups, setStagedTradePositionGroups] = useState(
    []
  );
  useEffect(() => {
    setStagedTradePositionGroups(
      stagedTradeAmounts &&
        calcPositionGroups(markets, positions, stagedTradeAmounts)
    );
  }, [markets, positions, stagedTradeAmounts]);

  let problemText;

  if (!marketStage === "Closed") {
    problemText = "The Market is closed.";
  } else if (!marketSelections) {
    problemText = "Select position(s) first.";
  }

  const makeStepper = useCallback(amount => {
    return e => {
      setStagedTransactionType("buy outcome tokens");
      setInvestmentAmount(prevValue => {
        let prevValueDecimal;
        try {
          if (prevValue === "") {
            prevValueDecimal = Decimal(0);
          } else {
            prevValueDecimal = Decimal(prevValue);
          }
        } catch (err) {
          return prevValue;
        }

        return prevValueDecimal.add(amount).toString();
      });
    };
  }, []);

  const setInvestmentMax = useCallback(() => {
    if (collateralBalance != null && collateral != null) {
      setStagedTransactionType("buy outcome tokens");
      setInvestmentAmount(
        Decimal(collateralBalance.totalAmount.toString())
          .div(Math.pow(10, collateral.decimals))
          .toFixed(4)
      );
    }
  }, [collateralBalance, collateral]);

  useEffect(() => {
    const hasConditional = (marketSelections || []).some(
      ({ isAssumed }) => isAssumed
    );
    let humanReadablePositions = {
      payOutWhen: {
        title: "Pay out when:",
        getGlue: () => "and",
        getPrefix: () => "IF",
        positions: []
      },
      loseInvestmentWhen: {
        title: "Lose investment when:",
        positions: [],
        getGlue: () => (hasConditional ? "and" : "or"),
        getPrefix: () => "IF"
      },
      refundWhen: {
        title: "Refund when:",
        positions: [],
        getGlue: () => "or",
        getPrefix: () => "IF"
      }
    };

    let stagePositionTradeAmount;

    try {
      stagePositionTradeAmount = Decimal(investmentAmount);
    } catch (err) {
      stagePositionTradeAmount = zeroDecimal;
    }

    (stagedTradePositionGroups || []).forEach(
      ({ outcomeSet, runningAmount }, index) => {
        //positions["payOutWhen"]

        let hasEnteredInvestment;

        try {
          const decimalInvest = Decimal(investmentAmount);
          hasEnteredInvestment = decimalInvest.gt(0);
        } catch (err) {}

        // all payouts
        humanReadablePositions.payOutWhen.positions = outcomeSet;
        humanReadablePositions.payOutWhen.runningAmount = hasEnteredInvestment
          ? runningAmount
          : zeroDecimal;

        // all lose invests

        // invert outcome sets
        humanReadablePositions.loseInvestmentWhen.positions = outcomeSet.map(
          outcome => {
            if (outcome.outcomeIndex == -1) {
              return outcome;
            }

            return {
              ...outcome,
              ...markets[outcome.marketIndex].outcomes[
                outcome.outcomeIndex == 0 ? 1 : 0
              ],
              outcomeIndex: outcome.outcomeIndex == 0 ? 1 : 0
            };
          }
        );
        humanReadablePositions.loseInvestmentWhen.runningAmount = Decimal(
          hasEnteredInvestment ? investmentAmount : zeroDecimal
        )
          .neg()
          .mul(Math.pow(10, collateral.decimals));
        humanReadablePositions.loseInvestmentWhen.margin = Decimal(-1.0);

        // refund when

        // invert outcome sets
        humanReadablePositions.refundWhen.positions = outcomeSet
          .filter(outcome => marketSelections[outcome.marketIndex].isAssumed)
          .map(outcome => {
            if (outcome.outcomeIndex == -1) {
              return outcome;
            }

            return {
              ...outcome,
              ...markets[outcome.marketIndex].outcomes[
                outcome.outcomeIndex == 0 ? 1 : 0
              ],
              outcomeIndex: outcome.outcomeIndex == 0 ? 1 : 0
            };
          });
        humanReadablePositions.refundWhen.runningAmount = Decimal(
          hasEnteredInvestment ? investmentAmount : zeroDecimal
        ).mul(Math.pow(10, collateral.decimals));
        humanReadablePositions.refundWhen.margin = Decimal(1.0);
      }
    );

    setHumanReadablePositions(humanReadablePositions);
  }, [stagedTradePositionGroups]);

  return (
    <>
      <div className={cx("buy-heading")}>
        Order Position(s){" "}
        <button type="button" className={cx("link-button", "clear")}>
          clear all
        </button>
      </div>
      {problemText && <div className={cx("buy-empty")}>{problemText}</div>}
      {error && (
        <div className={cx("buy-empty")}>
          {error === true ? "An error has occured" : error.message}
        </div>
      )}
      <div className={cx("buy-summary")}>
        {humanReadablePositions &&
          [
            humanReadablePositions.payOutWhen,
            humanReadablePositions.refundWhen,
            humanReadablePositions.loseInvestmentWhen
          ]
            .filter(category => category && category.positions.length)
            .map(category => (
              <Fragment key={category.title}>
                <div className={cx("buy-summary-heading")}>
                  {category.title}
                </div>
                <div className={cx("buy-summary-category")}>
                  <div className={cx("category-entries")}>
                    {category.positions.map(outcome => (
                      <OutcomeCard
                        key={`${outcome.marketIndex}-${outcome.outcomeIndex}`}
                        glueType={category.getGlue()}
                        prefixType={category.getPrefix()}
                        {...outcome}
                      />
                    ))}
                  </div>
                  <div className={cx("category-values")}>
                    <p className={cx("category-value", "value")}>
                      {formatCollateral(category.runningAmount, collateral)}
                    </p>
                    {/*<p className={cx("category-value", "margin")}>
                      ({category.margin > 0 && "+"}
                      {category.margin * 100}%)
                      </p>*/}
                  </div>
                </div>
              </Fragment>
            ))}
      </div>
      <div className={cx("buy-subheading")}>
        Total Investment ({collateral.name})
      </div>
      <div className={cx("buy-investment")}>
        <button
          className={cx("buy-invest", "buy-invest-minus")}
          onClick={makeStepper(-0.001)}
          type="button"
        >
          -
        </button>
        <div className={cx("input-group")}>
          <button
            className={cx("input-append", "link-button", "invest-max")}
            onClick={setInvestmentMax}
            type="button"
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
          onClick={makeStepper(0.001)}
          type="button"
        >
          +
        </button>
      </div>
      <div className={cx("buy-confirm")}>
        <button
          className={cx("button")}
          type="button"
          disabled={
            //!hasEnoughAllowance ||
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

Buy.propTypes = {
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

export default Buy;
