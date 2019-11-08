import React, { useState, useEffect, useCallback } from "react";
import cn from "classnames/bind";
import Spinner from "components/Spinner";

import { fromProbabilityToSlider } from "utils/scalar";
import { formatScalarValue } from "utils/formatting";

import style from "./buy.scss";
import Decimal from "decimal.js-light";

const cx = cn.bind(style);

const Buy = ({
  market,
  lmsrState,
  probabilities,
  marketSelection,
  setMarketSelections
}) => {
  const [sliderValue, setSliderValue] = useState(parseFloat(market.lowerBound));
  useEffect(() => {
    if (probabilities) {
      const value = fromProbabilityToSlider(market, probabilities[0]);
      setSliderValue(value);
    }
  }, []);

  const handleSliderChange = useCallback(e => {
    setSliderValue(parseFloat(e.target.value));
  }, []);

  const forMarketIndex = 0; // TODO: Multiple scalar markets will break this
  const makeOutcomeSelectHandler = useCallback(
    outcomeIndex => () => {
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

  if (!probabilities) {
    return <Spinner />;
  }

  if (lmsrState != null) {
    const { funding, positionBalances } = lmsrState;
    const invB = new Decimal(positionBalances.length)
      .ln()
      .div(funding.toString());

    const decimalUpper = new Decimal(market.upperBound);
    const decimalLower = new Decimal(market.lowerBound);
    const probabilitySim = new Decimal(sliderValue)
      .sub(decimalLower)
      .div(decimalUpper.sub(decimalLower));
    //console.log(probabilitySim.toString());
    const probabilityToMove = probabilitySim.sub(probabilities[0]);
    //console.log(probabilityToMove.toString());
    const normalizer = new Decimal(Math.abs(probabilityToMove))
      .ln()
      .neg()
      .div(invB);

    /*
    console.log(
      positionBalances
        .map((n, index) => {
          const isLong = index === 1;

          if (probabilityToMove.ispos() && isLong) {
            return new Decimal(n.toString()).div(normalizer);
          }

          if (probabilityToMove.isneg() && !isLong) {
            return new Decimal(n.toString()).div(normalizer);
          }

          return 0;
        })
        .map(n => n.toString())
    );
    */
  }

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
        <label className={cx("fieldset-label")}>Specify Amount</label>
        <div className={cx("input")}>
          <button type="button" className={cx("input-max")}>
            MAX
          </button>
          <input type="text" className={cx("investment")} defaultValue={0} />
          <span className={cx("input-right")}>DAI</span>
        </div>
      </div>
      <div className={cx("pl-sim")}>
        <div className={cx("desc")}>
          <label className={cx("fieldset-label")}>
            Profit/loss Simulator <small>(drag to slide)</small>
          </label>
          <p>Based on your current position</p>
        </div>
        <div className={cx("slider")}>
          <div className={cx("labels")}>
            <span>{formatScalarValue(market.lowerBound, market.unit)}</span>
            <span>
              {formatScalarValue(
                (market.upperBound - market.lowerBound) / 2 + market.lowerBound,
                market.unit
              )}
            </span>
            <span>{formatScalarValue(market.upperBound, market.unit)}</span>
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
            <span className={cx("value")}>-1.23% (1.123 DAI)</span>
          </div>
        </div>
      </div>
      <div className={cx("invest-summary")}>
        <div className={cx("summary")}>
          <div className={cx("row")}>
            <span className={cx("label")}>Max Payout</span>
            <span className={cx("spacer")} />
            <span className={cx("value")}>123 DAI</span>
          </div>
          <div className={cx("row")}>
            <span className={cx("label")}>Max Loss</span>
            <span className={cx("spacer")} />
            <span className={cx("value")}>123 DAI</span>
          </div>
          <div className={cx("row")}>
            <span className={cx("label")}>Fees (0.5%)</span>
            <span className={cx("spacer")} />
            <span className={cx("value")}>0.00223 DAI</span>
          </div>
          <div className={cx("row")}>
            <span className={cx("label")}>Total Cost</span>
            <span className={cx("spacer")} />
            <span className={cx("value")}>123.23 DAI</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Buy;
