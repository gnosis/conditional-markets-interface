import React, { useState, useEffect, useCallback } from "react";
import cn from "classnames/bind";
import Spinner from "components/Spinner";

import { fromProbabilityToSlider } from "utils/scalar";

import style from "./buy.scss";
import Decimal from "decimal.js-light";

const cx = cn.bind(style);

const Buy = ({ market, lmsrState, probabilities }) => {
  const [sliderValue, setSliderValue] = useState(market.lowerBound);
  useEffect(() => {
    if (probabilities) {
      const value = fromProbabilityToSlider(market, probabilities[0]);
      setSliderValue(value);
    }
  }, []);

  const handleSliderChange = useCallback(e => {
    setSliderValue(e.target.value);
  }, []);

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

    if (probabilityToMove.ispos()) {
      // invest long
    }
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
  }

  return (
    <div className={cx("buy")}>
      <div className={cx("selected-outcome")}>
        <label className={cx("fieldset-label")}>Pick Outcome</label>
        <div className={cx("outcomes")}>
          <button type="button" className={cx("outcome-button")}>
            <i className={cx("icon", "icon-arrow-down")} /> Short
          </button>
          <button type="button" className={cx("outcome-button")}>
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
        <div className={cx("slider")}>
          <div className={cx("labels")}>
            <span>
              {market.lowerBound} {market.unit}
            </span>
            <span>
              {(market.upperBound - market.lowerBound) / 2 + market.lowerBound}{" "}
              {market.unit}
            </span>
            <span>
              {market.upperBound} {market.unit}
            </span>
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
        <dl className={cx("pl-summary")}>
          <dt>Simulated Outcome</dt>
          <dd>P/L &amp; payout</dd>

          <dt>
            {sliderValue} {market.unit}
          </dt>
          <dd>-1.23% (1.123 DAI)</dd>
        </dl>
      </div>
      <div className={cx("invest-summary")}>
        <dl className={cx("summary")}>
          <dt>Max Payout</dt>
          <dd>123 DAI</dd>

          <dt>Max loss</dt>
          <dd>213 DAI</dd>
        </dl>
      </div>
    </div>
  );
};

export default Buy;
