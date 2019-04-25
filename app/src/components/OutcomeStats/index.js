import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";
import CountUp from "react-countup";
import { withState, compose } from "recompose";

import css from "./style.scss";

import { formatEther } from "./utils/numberFormat";

const cx = cn.bind(css);

const OutcomeStats = ({
  short,
  price,
  balance,
  isSelected,
  lastValue,
  setLastValue
}) => (
  <div className={cx("outcome-stat", { selected: isSelected })}>
    <div>
      <span className={cx("name")}>{short}&nbsp;</span>
    </div>
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

OutcomeStats.propTypes = {
  short: PropTypes.string.isRequired,
  price: PropTypes.string.isRequired,
  balance: PropTypes.string.isRequired,
  isSelected: PropTypes.bool.isRequired,
  lastValue: PropTypes.string.isRequired,
  setLastValue: PropTypes.func.isRequired
};

const enhancer = compose(
  withState("lastValue", "setLastValue", ({ balance }) =>
    parseInt(balance || "0", 10)
  )
);

export default enhancer(OutcomeStats);
