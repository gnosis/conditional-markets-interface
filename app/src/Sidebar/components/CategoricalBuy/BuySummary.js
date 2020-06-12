import React, { Fragment, useState, useEffect } from "react";
import PropTypes from "prop-types";
import Decimal from "decimal.js-light";

import cn from "classnames/bind";
import style from "./BuySummary.scss";

import { zeroDecimal, probabilityDecimalPlaces } from "utils/constants";
import { formatCollateral } from "utils/formatting";
import { calcPositionGroups } from "utils/position-groups";

const cx = cn.bind(style);

const BuySummary = ({
  markets,
  positions,
  collateral,
  lmsrState,
  stagedTradeAmounts,
  investmentAmount
}) => {
  const [humanReadablePositions, setHumanReadablePositions] = useState(null);
  const [stagedTradePositionGroups, setStagedTradePositionGroups] = useState(
    []
  );
  const [fee, setFee] = useState(0);

  useEffect(() => {
    setStagedTradePositionGroups(
      stagedTradeAmounts &&
        calcPositionGroups(markets, positions, stagedTradeAmounts)
    );

    if (lmsrState) {
      setFee(lmsrState.fee * 100);
    }
  }, [markets, positions, stagedTradeAmounts, lmsrState]);

  useEffect(() => {
    let humanReadablePositions = {
      payOutWhen: {
        tokenAmountTitle: "Outcome tokens",
        title: "ROI if winning outcome",
        feeTitle: "Of which fees (" + fee + "%)",
        positions: []
      },
      loseInvestmentWhen: {
        title: "Total cost:",
        positions: []
      }
    };

    (stagedTradePositionGroups || []).forEach(
      ({ outcomeSet, runningAmount, amount }) => {
        let hasEnteredInvestment;
        let investmentFee;

        try {
          const decimalInvest = Decimal(investmentAmount);
          hasEnteredInvestment = decimalInvest.gt(0);
          investmentFee = decimalInvest.mul(lmsrState.fee);
        } catch (err) {
          //
        }

        humanReadablePositions.payOutWhen.fee = investmentAmount
          ? investmentFee
          : 0;

        // all payouts
        humanReadablePositions.payOutWhen.positions = outcomeSet;
        humanReadablePositions.payOutWhen.tokenAmount = hasEnteredInvestment
          ? amount
          : zeroDecimal;

        humanReadablePositions.payOutWhen.runningAmount = hasEnteredInvestment
          ? runningAmount
          : zeroDecimal;

        humanReadablePositions.payOutWhen.increment = hasEnteredInvestment
          ? collateral.fromUnitsMultiplier.mul(runningAmount.toString())
              .sub(investmentAmount)
              .div(investmentAmount)
              .mul(100)
              .toDecimalPlaces(probabilityDecimalPlaces)
          : zeroDecimal;

        // all lose invests
        // invert outcome sets
        // humanReadablePositions.loseInvestmentWhen.positions = outcomeSet.map(
        //   selectedOutcome => {
        //     if (selectedOutcome.outcomeIndex == -1) {
        //       return selectedOutcome;
        //     }

        //     if (marketSelections[selectedOutcome.marketIndex].isAssumed) {
        //       return {
        //         ...selectedOutcome,
        //         ...markets[selectedOutcome.marketIndex].outcomes[
        //           selectedOutcome.outcomeIndex
        //         ]
        //       };
        //     }

        //     return {
        //       ...selectedOutcome,
        //       ...markets[selectedOutcome.marketIndex].outcomes[
        //         selectedOutcome.outcomeIndex == 0 ? 1 : 0
        //       ],
        //       outcomeIndex: selectedOutcome.outcomeIndex == 0 ? 1 : 0
        //     };
        //   }
        // );
        // humanReadablePositions.loseInvestmentWhen.runningAmount = Decimal(
        //   hasEnteredInvestment ? investmentAmount : zeroDecimal
        // )
        //   .neg()
        //   .mul(Math.pow(10, collateral.decimals));
      }
    );

    setHumanReadablePositions(humanReadablePositions);
  }, [stagedTradePositionGroups]);

  return (
    <>
      {humanReadablePositions &&
        [
          humanReadablePositions.payOutWhen // ,
          // humanReadablePositions.loseInvestmentWhen
        ]
          .filter(category => category && category.positions.length)
          .map(category => (
            <Fragment key={category.title}>
              {category.fee !== undefined && (
                <div className={cx("summary-element")}>
                  <span>{category.feeTitle}</span>
                  <span className={cx("dotted-separator")}></span>
                  <span className={cx("summary-element-value")}>
                    {category.fee.toString()} {collateral.symbol}
                  </span>
                </div>
              )}
              {category.tokenAmount !== undefined && (
                <div className={cx("summary-element")}>
                  <span>{category.tokenAmountTitle}</span>
                  <span className={cx("dotted-separator")}></span>
                  <span className={cx("summary-element-value")}>
                    {new Decimal(category.tokenAmount.toString())
                      .div(1e18)
                      .toSignificantDigits(4)
                      .toString()}
                  </span>
                </div>
              )}
              <div className={cx("summary-element")}>
                <span>{category.title}</span>
                <span className={cx("dotted-separator")}></span>
                <span className={cx("summary-element-value")}>
                  {formatCollateral(category.runningAmount, collateral)}
                  {category.increment && category.increment.abs().gt(0.01) && (
                    <span
                      className={cx("change-percentage", {
                        negative: category.increment.lt(0)
                      })}
                    >
                      {" "}
                      {category.increment.toString()}%
                    </span>
                  )}
                </span>
              </div>
            </Fragment>
          ))}
    </>
  );
};

BuySummary.propTypes = {
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
  lmsrState: PropTypes.shape({
    fee: PropTypes.string.isRequired
  }),
  // marketSelections: PropTypes.arrayOf(
  //   PropTypes.shape({
  //     isAssumed: PropTypes.bool.isRequired,
  //     selectedOutcomeIndex: PropTypes.number
  //   }).isRequired
  // ),
  stagedTradeAmounts: PropTypes.arrayOf(
    PropTypes.instanceOf(Decimal).isRequired
  ),
  investmentAmount: PropTypes.string
};

export default BuySummary;
