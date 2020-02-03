import React, { Fragment, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Decimal from "decimal.js-light";

import Web3 from "web3";

import cn from "classnames/bind";
import style from "./buy.scss";

import OutcomeSelection from "./OutcomeSelection";
import OutcomeCard from "components/OutcomeCard";
import { zeroDecimal } from "utils/constants";
import { formatCollateral } from "utils/formatting";
import {
  calcPositionGroups,
  calcOutcomeTokenCounts
} from "utils/position-groups";

const { BN } = Web3.utils;

const cx = cn.bind(style);

import getConditionalTokensService from "services/ConditionalTokensService";
let conditionalTokensService;

const Buy = ({
  account,
  markets,
  positions,
  collateral,
  collateralBalance,
  lmsrAllowance,
  lmsrState,
  marketSelections,
  setMarketSelections,
  stagedTradeAmounts,
  setStagedTradeAmounts,
  stagedTransactionType,
  setStagedTransactionType,
  ongoingTransactionType,
  resetMarketSelections,
  asWrappedTransaction,
  makeButtonSelectCallback
}) => {
  // Memoize fetching data files
  const loadDataLayer = useCallback(() => {
    async function getService() {
      conditionalTokensService = await getConditionalTokensService();
    }
    getService();
  }, []);

  // Load data layer just on page load
  useEffect(() => {
    loadDataLayer();
  }, []);

  const [investmentAmount, setInvestmentAmount] = useState("");
  const [humanReadablePositions, setHumanReadablePositions] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (stagedTransactionType !== "buy outcome tokens") return;

    let hasEnteredInvestment = false;

    try {
      const decimalInvest = Decimal(investmentAmount);
      hasEnteredInvestment = decimalInvest.gt(0);
    } catch (e) {
      //
    }

    if (
      !(marketSelections || []).some(
        ({ selectedOutcomeIndex }) => selectedOutcomeIndex > -1
      )
    ) {
      setStagedTradeAmounts(null);
      return;
    }

    try {
      const investmentAmountInUnits = collateral.toUnitsMultiplier.mul(
        hasEnteredInvestment ? investmentAmount : zeroDecimal
      );

      if (!investmentAmountInUnits.isInteger())
        throw new Error(
          `Got more than ${collateral.decimals} decimals in value ${investmentAmount}`
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

  const forMarketIndex = 0; // TODO: Multiple scalar markets will break this
  const handleMarketSelection = useCallback(
    selection => {
      setMarketSelections(prevValue => {
        return prevValue.map((marketSelection, marketSelectionIndex) => {
          if (forMarketIndex === marketSelectionIndex) {
            return {
              selectedOutcomeIndex: selection,
              isAssumed: selection === -1 ? false : marketSelection.isAssumed
            };
          }

          return {
            ...marketSelection
          };
        });
      });
    },
    [marketSelections]
  );

  let hasAnyAllowance = false;
  let hasEnoughAllowance = false;
  if (lmsrAllowance != null)
    try {
      hasAnyAllowance = lmsrAllowance.gtn(0);
      hasEnoughAllowance = collateral.toUnitsMultiplier
        .mul(investmentAmount || "0")
        .lte(lmsrAllowance.toString());
    } catch (e) {
      // empty
    }

  const clearAllPositions = useCallback(() => {
    setStagedTransactionType(null);
    setStagedTradeAmounts(null);
    setInvestmentAmount("");
    resetMarketSelections(null);
    setError(null);
  }, [setStagedTradeAmounts, setInvestmentAmount, setError]);

  const buyOutcomeTokens = useCallback(async () => {
    await conditionalTokensService.buyOutcomeTokens({
      investmentAmount,
      stagedTradeAmounts,
      stagedTransactionType,
      account,
      collateralBalance,
      hasAnyAllowance,
      hasEnoughAllowance
    });

    clearAllPositions();
    // Show positions component
    makeButtonSelectCallback(1);
  }, [
    investmentAmount,
    hasAnyAllowance,
    hasEnoughAllowance,
    stagedTransactionType,
    stagedTradeAmounts,
    conditionalTokensService,
    collateral,
    account
  ]);

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

  // const makeStepper = useCallback(amount => {
  //   return () => {
  //     setStagedTransactionType("buy outcome tokens");
  //     setInvestmentAmount(prevValue => {
  //       let prevValueDecimal;
  //       try {
  //         if (prevValue === "") {
  //           prevValueDecimal = Decimal(0);
  //         } else {
  //           prevValueDecimal = Decimal(prevValue);
  //         }
  //       } catch (err) {
  //         return prevValue;
  //       }

  //       return prevValueDecimal.add(amount).toString();
  //     });
  //   };
  // }, []);

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

    (stagedTradePositionGroups || []).forEach(
      ({ outcomeSet, runningAmount }) => {
        let hasEnteredInvestment;

        try {
          const decimalInvest = Decimal(investmentAmount);
          hasEnteredInvestment = decimalInvest.gt(0);
        } catch (err) {
          //
        }

        // all payouts
        humanReadablePositions.payOutWhen.positions = outcomeSet;
        humanReadablePositions.payOutWhen.runningAmount = hasEnteredInvestment
          ? runningAmount
          : zeroDecimal;

        // all lose invests

        // invert outcome sets
        humanReadablePositions.loseInvestmentWhen.positions = outcomeSet.map(
          selectedOutcome => {
            if (selectedOutcome.outcomeIndex == -1) {
              return selectedOutcome;
            }

            if (marketSelections[selectedOutcome.marketIndex].isAssumed) {
              return {
                ...selectedOutcome,
                ...markets[selectedOutcome.marketIndex].outcomes[
                  selectedOutcome.outcomeIndex
                ]
              };
            }

            return {
              ...selectedOutcome,
              ...markets[selectedOutcome.marketIndex].outcomes[
                selectedOutcome.outcomeIndex == 0 ? 1 : 0
              ],
              outcomeIndex: selectedOutcome.outcomeIndex == 0 ? 1 : 0
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
        Pick outcome{" "}
        <button
          type="button"
          className={cx("link-button", "clear")}
          onClick={clearAllPositions}
        >
          clear all
        </button>
      </div>
      <div className={cx("buy-select")}>
        <OutcomeSelection
          key="selection"
          outcomes={markets[forMarketIndex].outcomes}
          conditionId={markets[forMarketIndex].conditionId}
          marketSelection={marketSelections[forMarketIndex]}
          setOutcomeSelection={handleMarketSelection}
        />
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
                        // prefixType={category.getPrefix()}
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
        How many <b>&nbsp;outcome tokens&nbsp;</b> do you want to buy?
      </div>
      <div className={cx("buy-investment")}>
        {/* <button
          className={cx("buy-invest", "buy-invest-minus")}
          onClick={makeStepper(-0.1)}
          type="button"
        >
          –
        </button> */}
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
        {/* <button
          className={cx("buy-invest", "buy-invest-plus")}
          onClick={makeStepper(0.1)}
          type="button"
        >
          +
        </button> */}
      </div>
      <div className={cx("buy-confirm")}>
        <button
          className={cx("button")}
          type="button"
          disabled={
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
          Buy Position
        </button>
      </div>
    </>
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
  asWrappedTransaction: PropTypes.func.isRequired,
  resetMarketSelections: PropTypes.func.isRequired,
  makeButtonSelectCallback: PropTypes.func.isRequired
};

export default Buy;
