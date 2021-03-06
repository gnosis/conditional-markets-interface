import React, { Fragment, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Decimal from "decimal.js-light";

import cn from "classnames/bind";
import style from "./buy.scss";

import OutcomeCard from "components/OutcomeCard";

import { zeroDecimal } from "utils/constants";
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
      {humanReadablePositions &&
        [
          humanReadablePositions.payOutWhen,
          humanReadablePositions.refundWhen,
          humanReadablePositions.loseInvestmentWhen
        ]
          .filter(category => category && category.positions.length)
          .map(category => (
            <Fragment key={category.title}>
              <div className={cx("buy-summary-heading")}>{category.title}</div>
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
  )
};

export default BuySummary;
