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
  stagedTradeAmounts,
  marketSelections,
  investmentAmount
}) => {
  const [humanReadablePositions, setHumanReadablePositions] = useState(null);
  const [stagedTradePositionGroups, setStagedTradePositionGroups] = useState(
    []
  );
  useEffect(() => {
    setStagedTradePositionGroups(
      stagedTradeAmounts &&
        calcPositionGroups(markets, positions, stagedTradeAmounts)
    );
  }, [markets, positions, stagedTradeAmounts]);

  useEffect(() => {
    let humanReadablePositions = {
      payOutWhen: {
        title: "ROI if markets resolves to selected outcome:",
        positions: []
      },
      loseInvestmentWhen: {
        title: "Total cost:",
        positions: []
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
        humanReadablePositions.payOutWhen.changeInProbability = hasEnteredInvestment
          ? collateral.fromUnitsMultiplier.mul(runningAmount.toString())
              .sub(investmentAmount)
              .mul(100)
              .toDecimalPlaces(probabilityDecimalPlaces)
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
      }
    );

    setHumanReadablePositions(humanReadablePositions);
  }, [stagedTradePositionGroups]);

  return (
    <>
      {humanReadablePositions &&
        [
          humanReadablePositions.payOutWhen,
          humanReadablePositions.loseInvestmentWhen
        ]
          .filter(category => category && category.positions.length)
          .map(category => (
            <Fragment key={category.title}>
              <div className={cx("summary-heading")}>{category.title}</div>
              <div className={cx("summary-category")}>
                <div className={cx("category-values")}>
                  <p className={cx("category-value", "value")}>
                    {formatCollateral(category.runningAmount, collateral)}
                    {category.changeInProbability &&
                      category.changeInProbability.abs().gt(0.01) && (
                        <span
                          className={cx("change-percentage", {
                            negative: category.changeInProbability.lt(0)
                          })}
                        >
                          {" "}
                          {category.changeInProbability.toString()}%
                        </span>
                      )}
                  </p>
                </div>
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
  marketSelections: PropTypes.arrayOf(
    PropTypes.shape({
      isAssumed: PropTypes.bool.isRequired,
      selectedOutcomeIndex: PropTypes.number
    }).isRequired
  ),
  stagedTradeAmounts: PropTypes.arrayOf(
    PropTypes.instanceOf(Decimal).isRequired
  ),
  investmentAmount: PropTypes.string
};

export default BuySummary;
