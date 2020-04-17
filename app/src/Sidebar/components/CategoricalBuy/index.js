import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Decimal from "decimal.js-light";
import ToastifyError from "utils/ToastifyError";

import Web3 from "web3";

import cn from "classnames/bind";
import style from "./buy.scss";

import useGlobalState from "hooks/useGlobalState";

import OutcomeSelection from "./OutcomeSelection";
import BuySummary from "./BuySummary";
import AmountInput from "../Buy/AmountInput";
import { zeroDecimal } from "utils/constants";
import { calcOutcomeTokenCounts } from "utils/position-groups";

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
  stageTransactions,
  selectTabCallback
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
    return () => {
      setStagedTradeAmounts(null);
    };
  }, []);

  const { marketProbabilities } = useGlobalState();

  const [investmentAmount, setInvestmentAmount] = useState("");
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

  const clearAllPositions = useCallback(() => {
    setStagedTransactionType(null);
    setStagedTradeAmounts(null);
    setInvestmentAmount("");
    resetMarketSelections(null);
    setError(null);
  }, [setStagedTradeAmounts, setInvestmentAmount, setError]);

  const buyOutcomeTokens = useCallback(async () => {
    const transactions = [
      {
        name: "Set Allowance",
        description:
          "This permission allows Sight to interact with your DAI. This has to be done only once for each collateral type.",
        precheck: async () => {
          return conditionalTokensService.needsMoreAllowance({
            investmentAmount,
            stagedTradeAmounts,
            account,
            collateralBalance
          });
        },
        commit: async () => {
          return conditionalTokensService.setAllowance({
            investmentAmount,
            stagedTradeAmounts,
            account,
            collateralBalance
          });
        }
      },
      {
        name: "Buy Outcome Tokens",
        description:
          "Allowance is now set. You can now submit your selected buy position.",
        commit: async () => {
          return conditionalTokensService.buyOutcomeTokens({
            investmentAmount,
            stagedTradeAmounts,
            stagedTransactionType,
            account,
            collateralBalance
          });
        },
        cleanup: result => {
          if (result && !result.modal) {
            clearAllPositions();
            // Show positions component
            selectTabCallback(1);
          }
          return result;
        }
      }
    ];

    try {
      await stageTransactions(transactions);
    } catch (err) {
      setError(err);
    }
  }, [
    investmentAmount,
    stagedTransactionType,
    stagedTradeAmounts,
    conditionalTokensService,
    collateral,
    account
  ]);

  /*
  const buyOutcomeTokens = useCallback(async () => {
    return conditionalTokensService
      .buyOutcomeTokens({
        investmentAmount,
        stagedTradeAmounts,
        stagedTransactionType,
        account,
        collateralBalance
      })
      .then(result => {
        if (!result.modal) {
          clearAllPositions();
          // Show positions component
          selectTabCallback(1);
        }
        return result;
      });
  }, [
    investmentAmount,
    stagedTransactionType,
    stagedTradeAmounts,
    conditionalTokensService,
    collateral,
    account
  ]);
  */

  let problemText;

  if (!marketStage === "Closed") {
    problemText = "The Market is closed.";
  } else if (!marketSelections) {
    problemText = "Select position(s) first.";
  }

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
          probabilities={
            marketProbabilities && marketProbabilities[forMarketIndex]
          }
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
      <div className={cx("buy-investment")}>
        <label className={cx("input-label")}>
          How much <b>&nbsp;{collateral.symbol}&nbsp;</b> would you like to
          invest?
        </label>
        <AmountInput
          {...{
            collateral,
            setInvestmentMax,
            investmentAmount,
            setStagedTransactionType,
            setInvestmentAmount
          }}
        />
      </div>
      <div className={cx("buy-summary")}>
        <BuySummary
          {...{
            markets,
            positions,
            collateral,
            stagedTradeAmounts,
            marketSelections,
            investmentAmount
          }}
        />
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
          onClick={buyOutcomeTokens}
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
  marketSelections: PropTypes.arrayOf(
    PropTypes.shape({
      isAssumed: PropTypes.bool.isRequired,
      selectedOutcomeIndex: PropTypes.number
    }).isRequired
  ),
  stagedTradeAmounts: PropTypes.arrayOf(
    PropTypes.instanceOf(Decimal).isRequired
  ),
  stageTransactions: PropTypes.func.isRequired,
  setStagedTradeAmounts: PropTypes.func.isRequired,
  stagedTransactionType: PropTypes.string,
  setStagedTransactionType: PropTypes.func.isRequired,
  ongoingTransactionType: PropTypes.string,
  asWrappedTransaction: PropTypes.func.isRequired,
  setMarketSelections: PropTypes.func.isRequired,
  resetMarketSelections: PropTypes.func.isRequired,
  selectTabCallback: PropTypes.func.isRequired
};

export default Buy;
