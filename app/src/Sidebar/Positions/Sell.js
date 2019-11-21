import React, { useCallback, useEffect, useState } from "react";
import cn from "classnames/bind";
import style from "./positions.scss";
import Decimal from "decimal.js-light";
import OutcomeCard, { Dot } from "../../components/OutcomeCard";
import Spinner from "../../components/Spinner";
import {
  zeroDecimal,
  collateralSignificantDigits
} from "../../utils/constants";

import Select from "react-select";

const cx = cn.bind(style);

const getBaseArray = length => {
  return Array(length).fill("0");
};

const Sell = ({
  markets,
  currentSellingPosition,
  onCancelSell,
  positions,
  stagedTradeAmounts,
  setStagedTradeAmounts,
  marketMakersRepo,
  positionBalances,
  collateral
}) => {
  const groupedSellAmounts = Array.from({ length: positions.length }, (_, i) =>
    currentSellingPosition.positions.find(
      ({ positionIndex }) => positionIndex === i
    ) == null
      ? zeroDecimal
      : currentSellingPosition.amount
  );
  const maxSellAmounts = groupedSellAmounts.map(
    amount => new Decimal(amount.toString())
  );

  const [sellAmountFullUnit, setSellAmountFullUnit] = useState("0");
  const [estimatedSaleEarning, setEstimatedSaleEarning] = useState(null);
  const [error, setError] = useState(null);
  const {
    outcomeIndex: selectedOutcomeIndex,
    marketIndex
  } = currentSellingPosition.outcomeSet[0]; // # 0 index because single markets for now
  const availableOutcomes = markets[marketIndex].outcomes.map(
    (outcome, index) => ({
      label: (
        <>
          <Dot index={index} /> {outcome.title}
        </>
      ),
      value: index
    })
  );

  const setSellAmountToMax = useCallback(() => {
    setSellAmountFullUnit(
      new Decimal(maxSellAmounts[selectedOutcomeIndex].toString())
        .div(1e18)
        .toSignificantDigits(4)
        .toString()
    );
  }, [maxSellAmounts]);

  useEffect(() => {
    setSellAmountToMax();
  }, []);

  useEffect(() => {
    (async () => {
      setEstimatedSaleEarning(null);
      if (sellAmountFullUnit && !isNaN(parseFloat(sellAmountFullUnit))) {
        setError(null);
        setEstimatedSaleEarning(null);
        // We get set a position array where we only have 1 position bought
        let balanceForThisPosition = getBaseArray(positionBalances.length);
        // Include in this call only the balance for this position
        // Note the negative value, it's because of being a sell price
        const isInvestingMoreThanAvailable = new Decimal(sellAmountFullUnit)
          .mul(1e18)
          .gt(maxSellAmounts[selectedOutcomeIndex]);

        if (isInvestingMoreThanAvailable) {
          setError("You're investing more than you have available");
          balanceForThisPosition[selectedOutcomeIndex] = new Decimal(
            maxSellAmounts[selectedOutcomeIndex]
          )
            .todp(0)
            .neg()
            .toint()
            .toString();
        } else {
          balanceForThisPosition[selectedOutcomeIndex] = new Decimal(
            sellAmountFullUnit
          )
            .mul(1e18)
            .todp(0)
            .neg()
            .toint()
            .toString();
        }

        // Calculate the balance for this position
        // return as positive value for the frontend
        const estimatedEarning = (await marketMakersRepo.calcNetCost(
          balanceForThisPosition
        ))
          .abs()
          .toString();
        setEstimatedSaleEarning(estimatedEarning);
      }
    })();
  }, [sellAmountFullUnit]);

  if (maxSellAmounts.filter(dec => dec.abs().gt(0)).length > 1) {
    console.error("Can only handle single position");
    return (
      <div className={cx("sell")}>
        Invalid Market Configuration - An outcome has too many positions.
      </div>
    );
  }

  return (
    <div className={cx("sell")}>
      <div className={cx("sell-heading")}>
        Sell Position
        <button
          className={cx("sell-cancel")}
          type="button"
          defaultValue={selectedOutcomeIndex}
          onClick={onCancelSell}
        />
      </div>
      <div className={cx("sell-form")}>
        <div className={cx("sell-form-row")}>
          <label>Position</label>
          <div className={cx("entry")}>
            <Select
              options={availableOutcomes}
              value={availableOutcomes[selectedOutcomeIndex]}
            />
          </div>
        </div>
        <div className={cx("sell-form-row")}>
          <label>Quantity</label>
          <div className={cx("entry")}>
            <div className={cx("input-group")}>
              <input
                type="number"
                readOnly
                value={maxSellAmounts[selectedOutcomeIndex]
                  .div(1e18)
                  .toSignificantDigits(4)
                  .toString()}
                className={cx("input")}
              />
              <span className={cx("input-append", "collateral-name")}>
                <abbr title="Outcome Tokens">OT</abbr>
              </span>
            </div>
          </div>
        </div>
        <div className={cx("sell-form-row")}>
          <label>Sell Quantity</label>
          <div className={cx("entry")}>
            <div className={cx("input-group")}>
              <button
                className={cx("input-append", "link-button", "invest-max")}
                onClick={setSellAmountToMax}
                type="button"
              >
                all
              </button>
              <input
                type="number"
                value={sellAmountFullUnit || ""}
                className={cx("input", { error: !!error })}
                onChange={e => {
                  setSellAmountFullUnit(e.target.value);
                }}
              />
              <span className={cx("input-append", "collateral-name")}>
                <abbr title="Outcome Tokens">OT</abbr>
              </span>
            </div>
          </div>
        </div>
        <div className={cx("sell-form-row")}>
          <label>Sell Price</label>
          <div className={cx("entry")}>
            <div className={cx("input-group")}>
              {estimatedSaleEarning == null ? (
                <Spinner width={12} height={12} />
              ) : (
                <input
                  type="number"
                  readOnly
                  value={new Decimal(estimatedSaleEarning)
                    .div(Math.pow(10, collateral.decimals))
                    .toSignificantDigits(collateralSignificantDigits)
                    .toString()}
                  className={cx("input")}
                />
              )}
              <span className={cx("input-append", "collateral-name")}>
                <abbr title={collateral.name}>{collateral.symbol}</abbr>
              </span>
            </div>
          </div>
        </div>
        <div className={cx("sell-form-row")}>
          <label></label>
          <div className={cx("entry")}>
            <button className={cx("sell-confirm")}>Place Sell Order</button>
          </div>
        </div>
        {error && <div className={cx("sell-form-row")}>{error}</div>}
      </div>
    </div>
  );
};

export default Sell;
