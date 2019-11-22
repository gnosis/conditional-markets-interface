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
import Web3 from "web3";

const { toBN } = Web3.utils;

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
  ongoingTransactionType,
  setStagedTransactionType,
  setStagedTradeAmounts,
  marketMakersRepo,
  positionBalances,
  collateral,
  sellOutcomeTokens,
  onOutcomeChange,
  positionGroups
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

  const [status, setStatus] = useState(null);
  const [sellAmountFullUnit, setSellAmountFullUnit] = useState("0");
  const [estimatedSaleEarning, setEstimatedSaleEarning] = useState(null);
  const [error, setError] = useState(null);
  const {
    outcomeIndex: selectedOutcomeIndex,
    marketIndex
  } = currentSellingPosition.outcomeSet[0]; // # 0 index because single markets for now
  const availableOutcomes = positionGroups.map(
    ({ outcomeSet: [outcome] }, index) => ({
      label: (
        <>
          <Dot index={index} /> {outcome.title}
        </>
      ),
      value: index
    })
  );

  const setSellAmountToMax = useCallback(() => {
    const maxInvest = new Decimal(
      maxSellAmounts[selectedOutcomeIndex].toString()
    )
      .div(1e18)
      .toSignificantDigits(4)
      .toString();

    handleSellAmountChange(maxInvest);
    return maxInvest;
  }, [maxSellAmounts, setStagedTradeAmounts]);

  const updateEstimatedEarnings = useCallback(
    sellAmount => {
      setError(null);
      setEstimatedSaleEarning(null);
      let balanceForThisPosition = getBaseArray(positionBalances.length);
      // Include in this call only the balance for this position
      // Note the negative value, it's because of being a sell price
      const isInvestingMoreThanAvailable = new Decimal(sellAmount)
        .mul(1e18)
        .gt(maxSellAmounts[selectedOutcomeIndex]);

      if (isInvestingMoreThanAvailable) {
        setError("You're investing more than you have available");
        balanceForThisPosition[selectedOutcomeIndex] = toBN(
          new Decimal(maxSellAmounts[selectedOutcomeIndex])
            .todp(0)
            .neg()
            .toint()
            .toString()
        );
      } else {
        balanceForThisPosition[selectedOutcomeIndex] = toBN(
          new Decimal(sellAmount)
            .mul(1e18)
            .todp(0)
            .neg()
            .toint()
            .toString()
        );
      }

      // Calculate the balance for this position
      // return as positive value for the frontend
      marketMakersRepo
        .calcNetCost(balanceForThisPosition)
        .then(tradeEarning => {
          setEstimatedSaleEarning(tradeEarning.abs().toString());
        });
    },
    [sellAmountFullUnit, positionBalances, positions, selectedOutcomeIndex]
  );

  // Update estimated earnings on first render
  useEffect(() => {
    setStagedTransactionType("sell outcome tokens");

    const maxInvest = setSellAmountToMax();
    updateEstimatedEarnings(maxInvest);
  }, [currentSellingPosition]);

  const handleSellAmountChange = useCallback(
    eventOrValue => {
      const value =
        typeof eventOrValue === "object"
          ? eventOrValue.target.value
          : eventOrValue;
      setSellAmountFullUnit(value);

      if (!isNaN(parseFloat(value)) && isFinite(parseFloat(value))) {
        const tradeAmountInWei = new Decimal(value)
          .mul(1e18)
          .neg()
          .toInteger();
        const tradeAmounts = getBaseArray(positions.length).map(
          n => new Decimal(n)
        );
        updateEstimatedEarnings(value);

        // When sell amount is 0.0001 units close to max amount, sell max amount
        // this makes sure no teeny-tiny values remain

        const tradeDiff = tradeAmountInWei
          .abs() // trade amount is neg
          .sub(maxSellAmounts[selectedOutcomeIndex])
          .abs();

        if (tradeDiff.lt(Math.pow(10, 18 - 5))) {
          // sell max amount
          tradeAmounts[selectedOutcomeIndex] = maxSellAmounts[
            selectedOutcomeIndex
          ].sub(1);
        } else {
          // sell entered amount
          tradeAmounts[selectedOutcomeIndex] = tradeAmountInWei;
        }

        tradeAmounts[selectedOutcomeIndex] = tradeAmountInWei;
        setStagedTradeAmounts(tradeAmounts);
      }
    },
    [positions, setStagedTradeAmounts, maxSellAmounts]
  );

  const handleSell = useCallback(() => {
    setStatus("LOADING");
    sellOutcomeTokens()
      .then(() => {
        setStatus("SUCCESS");
      })
      .catch(err => {
        console.error(err);
        setStatus("ERROR");
      });
  });

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
              onChange={onOutcomeChange}
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
                onChange={handleSellAmountChange}
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
              <input
                type="text"
                readOnly
                value={
                  estimatedSaleEarning
                    ? new Decimal(estimatedSaleEarning)
                        .div(Math.pow(10, collateral.decimals))
                        .toSignificantDigits(collateralSignificantDigits)
                        .toString()
                    : "..."
                }
                className={cx("input")}
              />
              <span className={cx("input-append", "collateral-name")}>
                <abbr title={collateral.name}>{collateral.symbol}</abbr>
              </span>
            </div>
          </div>
        </div>
        <div className={cx("sell-form-row")}>
          <label></label>
          <div className={cx("entry")}>
            <button
              className={cx("sell-confirm")}
              onClick={handleSell}
              disabled={ongoingTransactionType === "sell outcome tokens"}
            >
              Place Sell Order
            </button>
          </div>
        </div>
        {error && <div className={cx("sell-form-row")}>{error}</div>}
      </div>
    </div>
  );
};

export default Sell;
