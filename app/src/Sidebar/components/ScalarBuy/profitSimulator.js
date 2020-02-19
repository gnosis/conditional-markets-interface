import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";
import Decimal from "decimal.js-light";

import PercentageFormat from "components/Formatting/PercentageFormat";

import { fromProbabilityToSlider } from "utils/scalar";
import { formatScalarValue, formatCollateral } from "utils/formatting";
import { zeroDecimal, oneDecimal } from "utils/constants";

import style from "./profitSimulator.scss";

const cx = cn.bind(style);

const profitSimulator = ({
  market,
  probabilities,
  stagedTradeAmounts,
  marketSelection,
  investmentAmount,
  collateral
}) => {
  const [profitSim, setProfitSim] = useState({
    value: 0,
    percent: 0,
    maxPayout: 0,
    minPayout: 0,
    fee: 0,
    cost: 0
  });

  const decimalUpper = new Decimal(market.upperBound);
  const decimalLower = new Decimal(market.lowerBound);

  const [sliderValue, setSliderValue] = useState(decimalLower);

  useEffect(() => {
    if (probabilities) {
      const value = fromProbabilityToSlider(market, probabilities[1]);
      setSliderValue(value);
    }
  }, []);

  const handleSliderChange = useCallback(e => {
    setSliderValue(parseFloat(e.target.value));
  }, []);

  useEffect(() => {
    if (stagedTradeAmounts && marketSelection.selectedOutcomeIndex > -1) {
      const maxPayout = new Decimal(
        stagedTradeAmounts[marketSelection.selectedOutcomeIndex]
      );

      let hasEnteredInvestment = false;

      try {
        const decimalInvest = Decimal(investmentAmount);
        hasEnteredInvestment = decimalInvest.gt(0);
      } catch (e) {
        //
      }

      const investmentAmountInUnits = collateral.toUnitsMultiplier.mul(
        hasEnteredInvestment ? investmentAmount : zeroDecimal
      );

      const normalizedSlider = new Decimal(sliderValue)
        .sub(decimalLower)
        .div(decimalUpper.sub(decimalLower));

      // the inverted version of this slider, going from 0 to 1 instead of 1 to 0, to show the opposite outcome
      const invertSlider = oneDecimal.sub(normalizedSlider);

      const profitAmount = maxPayout.mul(
        marketSelection.selectedOutcomeIndex === 0
          ? invertSlider
          : normalizedSlider
      );
      setProfitSim({
        maxPayout: maxPayout.toString(),
        minPayout: "0",
        fee: investmentAmountInUnits.mul(0.05).toString(),
        cost: investmentAmountInUnits.toString(),
        value: profitAmount.toString(),
        percent: investmentAmountInUnits.gt(0)
          ? profitAmount
              .sub(investmentAmountInUnits)
              .div(investmentAmountInUnits)
              .mul(100)
              .toNumber()
          : 0
      });
    }
  }, [sliderValue, marketSelection, stagedTradeAmounts]);

  return (
    <>
      <div>
        <div className={cx("slider")}>
          <div className={cx("labels")}>
            <span>{formatScalarValue(decimalLower, market.unit)}</span>
            <span>
              {formatScalarValue(
                decimalUpper
                  .minus(decimalLower)
                  .div(2)
                  .add(decimalLower),
                market.unit
              )}
            </span>
            <span>{formatScalarValue(decimalUpper, market.unit)}</span>
          </div>
          <div className={cx("input")}>
            <input
              type="range"
              min={market.lowerBound}
              max={market.upperBound}
              defaultValue={sliderValue} /* uncontrolled for better UX */
              onInput={handleSliderChange}
            />
          </div>
        </div>
        <div className={cx("summary", "profit-loss-sim")}>
          <div className={cx("row")}>
            <span className={cx("label")}>Simulated Outcome</span>
            <span className={cx("spacer")} />
            <span className={cx("label")}>P/L &amp; payout</span>
          </div>
          <div className={cx("row")}>
            <span className={cx("value")}>
              {sliderValue.toFixed(market.decimals)} {market.unit}
            </span>
            <span className={cx("spacer")} />
            <span className={cx("value")}>
              <PercentageFormat
                value={profitSim.percent}
                classNamePositive={cx("percentage-pos")}
                classNameNegative={cx("percentage-neg")}
              />
              &nbsp;
              {formatCollateral(profitSim.value, collateral)}
            </span>
          </div>
        </div>
      </div>
      <div className={cx("invest-summary")}>
        <div className={cx("summary")}>
          <div className={cx("row")}>
            <span className={cx("label")}>Max Payout</span>
            <span className={cx("spacer")} />
            <span className={cx("value")}>
              {formatCollateral(profitSim.maxPayout, collateral)}
            </span>
          </div>
          <div className={cx("row")}>
            <span className={cx("label")}>Max Loss</span>
            <span className={cx("spacer")} />
            <span className={cx("value")}>
              {formatCollateral(profitSim.cost, collateral)}
            </span>
          </div>
          {/*<div className={cx("row")}>
            <span className={cx("label")}>Fees (0.5%)</span>
            <span className={cx("spacer")} />
            <span className={cx("value")}>
              {formatCollateral(profitSim.fee, collateral)}
            </span>
          </div>*/}
        </div>
      </div>
    </>
  );
};

profitSimulator.propTypes = {
  market: PropTypes.shape({
    upperBound: PropTypes.string.isRequired,
    lowerBound: PropTypes.string.isRequired,
    unit: PropTypes.string.isRequired,
    decimals: PropTypes.string.isRequired,
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
  probabilities: PropTypes.arrayOf(PropTypes.shape()),
  collateral: PropTypes.shape({
    contract: PropTypes.object.isRequired,
    name: PropTypes.string.isRequired,
    symbol: PropTypes.string.isRequired,
    decimals: PropTypes.number.isRequired,
    isWETH: PropTypes.bool.isRequired
  }).isRequired,
  stagedTradeAmounts: PropTypes.arrayOf(
    PropTypes.instanceOf(Decimal).isRequired
  )
};

export default profitSimulator;
