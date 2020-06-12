import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Decimal from "decimal.js-light";

import Web3 from "web3";

import cn from "classnames/bind";
import Spinner from "components/Spinner";
import ProfitSimulator from "./profitSimulator";
import AmountInput from "../Buy/AmountInput";

import style from "./buy.scss";
import { zeroDecimal } from "utils/constants";
import { calcOutcomeTokenCounts } from "utils/position-groups";
import { getMarketProbabilities } from "utils/probabilities";

const { BN } = Web3.utils;

const cx = cn.bind(style);

import getConditionalTokensService from "services/ConditionalTokensService";
let conditionalTokensService;

const Buy = ({
  market,
  lmsrState,
  marketSelection,
  setMarketSelections,
  stagedTradeAmounts,
  stagedTransactionType,
  collateral,
  collateralBalance,
  account,
  positions,
  marketSelections,
  setStagedTradeAmounts,
  setStagedTransactionType,
  ongoingTransactionType,
  resetMarketSelections,
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

      // We have to substract the fee
      const investmentAmountInUnitsAfterFee = investmentAmountInUnits
        .div(Decimal(1).add(lmsrState.fee))
        .toDecimalPlaces(0);

      if (!investmentAmountInUnitsAfterFee.isInteger())
        throw new Error(
          `Got more than ${collateral.decimals} decimals in value ${investmentAmount}`
        );

      setStagedTradeAmounts(
        calcOutcomeTokenCounts(
          positions,
          lmsrState,
          investmentAmountInUnitsAfterFee,
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

  const forMarketIndex = 0; // TODO: Multiple scalar markets will break this
  const makeOutcomeSelectHandler = useCallback(
    outcomeIndex => () => {
      setStagedTransactionType("buy outcome tokens");
      setMarketSelections(prevValues =>
        prevValues.map((marketSelection, marketIndex) => {
          if (marketIndex === forMarketIndex) {
            return {
              selectedOutcomeIndex: outcomeIndex,
              isAssumed: false
            };
          }
          return marketSelection;
        })
      );
    },
    []
  );

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
      await stageTransactions("buy outcome tokens", transactions);
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

  const [probabilities, setProbabilities] = useState(null);

  useEffect(() => {
    if (lmsrState !== null) {
      const { funding, positionBalances } = lmsrState;

      const { newMarketProbabilities } = getMarketProbabilities(
        funding,
        positionBalances,
        [market],
        positions,
        marketSelections
      );

      // Return probabilities for only one market
      setProbabilities(newMarketProbabilities[0]);
    }
  }, [lmsrState, market, positions]);

  if (!probabilities) {
    return <Spinner />;
  }

  const showProfitSim =
    lmsrState !== null && marketSelection.selectedOutcomeIndex > -1;

  return (
    <div className={cx("buy")}>
      <div className={cx("selected-outcome")}>
        <label className={cx("fieldset-label")}>Pick Outcome</label>
        <div className={cx("outcomes")}>
          <button
            type="button"
            className={cx("outcome-button", {
              active: marketSelection.selectedOutcomeIndex === 0
            })}
            onClick={makeOutcomeSelectHandler(0)}
          >
            <i className={cx("icon", "icon-arrow-down")} /> Short
          </button>
          <button
            type="button"
            className={cx("outcome-button", {
              active: marketSelection.selectedOutcomeIndex === 1
            })}
            onClick={makeOutcomeSelectHandler(1)}
          >
            <i className={cx("icon", "icon-arrow-up")} /> Long
          </button>
        </div>
      </div>
      <div className={cx("selected-invest")}>
        <label className={cx("fieldset-label")}>
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
      <div className={cx("pl-sim")}>
        <div className={cx("desc")}>
          <label className={cx("fieldset-label")}>
            Profit/Loss Simulator <small>(drag to slide)</small>
          </label>
          {showProfitSim ? (
            <p>Based on your current position</p>
          ) : (
            <p>Pick outcome and specify investment first</p>
          )}
        </div>
        {showProfitSim && (
          <ProfitSimulator
            {...{
              market,
              probabilities,
              stagedTradeAmounts,
              marketSelection,
              investmentAmount,
              collateral
            }}
            fee={lmsrState.fee}
          ></ProfitSimulator>
        )}
        <div className={cx("invest-ctrls")}>
          {marketSelection.selectedOutcomeIndex > -1 && (
            <button
              className={cx("buy-button")}
              type="button"
              disabled={ongoingTransactionType != null}
              onClick={buyOutcomeTokens}
            >
              {ongoingTransactionType === "buy outcome tokens" ? (
                <Spinner inverted width={12} height={12} />
              ) : (
                `Buy ${
                  market.outcomes[marketSelection.selectedOutcomeIndex].title
                } Position`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

Buy.propTypes = {
  account: PropTypes.string.isRequired,
  market: PropTypes.shape({
    outcomes: PropTypes.arrayOf(
      PropTypes.shape({
        positions: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.string.isRequired
          }).isRequired
        ).isRequired
      }).isRequired
    ).isRequired
  }).isRequired,
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
    stage: PropTypes.string.isRequired,
    fee: PropTypes.string.isRequired
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
  setStagedTradeAmounts: PropTypes.func.isRequired,
  stagedTransactionType: PropTypes.string,
  setStagedTransactionType: PropTypes.func.isRequired,
  ongoingTransactionType: PropTypes.string,
  asWrappedTransaction: PropTypes.func.isRequired,
  resetMarketSelections: PropTypes.func.isRequired,
  selectTabCallback: PropTypes.func.isRequired
};

export default Buy;
