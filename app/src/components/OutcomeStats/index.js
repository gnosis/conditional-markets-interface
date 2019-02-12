import React from "react";
import cn from "classnames/bind";
import CountUp from "react-countup";
import { withState, compose } from "recompose";

import css from "./style.scss";

import { formatEther } from "./utils/numberFormat";

const cx = cn.bind(css);

const OutcomeStats = ({ name, price, balance, isCorrect, isSelected, lastValue, setLastValue }) => (
  <div className={cx("outcome-stat", { selected: isSelected })}>
    <p className={cx("name")}>
      {name}&nbsp;
      {isCorrect && <strong>Winning Outcome</strong>}
    </p>
    <dl className={cx("stats")}>
      <dt>Price</dt>
      <dd>{formatEther(price)}</dd>
    </dl>
    <dl className={cx("stats")}>
      <dt>Balance</dt>
      <dd>
        <CountUp
          duration={0.5}
          start={parseInt(lastValue, 10)}
          onEnd={() => setLastValue(balance)}
          end={parseInt(balance || "0", 10)}
        />{" "}
        Outcome Tokens
      </dd>
    </dl>
  </div>
);

const enhancer = compose(withState("lastValue", "setLastValue", ({ balance }) => parseInt(balance || "0", 10)));

export default enhancer(OutcomeStats);
