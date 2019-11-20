import React from "react";
import cn from "classnames/bind";
import style from "./positions.scss";
import OutcomeCard, { Dot } from "../../components/OutcomeCard";

import Select from "react-select";

const cx = cn.bind(style);

const Sell = ({ markets, currentSellingPosition, onCancelSell }) => {
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
            <Select options={availableOutcomes} />
          </div>
        </div>
        <div className={cx("sell-form-row")}>
          <label>Quantity</label>
          <div className={cx("entry")}>
            <input type="text" />
          </div>
        </div>
        <div className={cx("sell-form-row")}>
          <label>Sell Quantity</label>
          <div className={cx("entry")}>
            <input type="text" />
          </div>
        </div>
        <div className={cx("sell-form-row")}>
          <label>Sell Price</label>
          <div className={cx("entry")}>
            <input type="text" />
          </div>
        </div>
        <div className={cx("sell-form-row")}>
          <label></label>
          <div className={cx("entry")}>
            <button className={cx("sell-confirm")}>Place Sell Order</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sell;
