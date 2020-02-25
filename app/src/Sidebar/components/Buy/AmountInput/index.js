import React from "react";
import PropTypes from "prop-types";

import cn from "classnames/bind";

import style from "./AmountInput.scss";

const cx = cn.bind(style);

const AmountInput = ({
  collateral,
  setInvestmentMax,
  investmentAmount,
  setStagedTransactionType,
  setInvestmentAmount
}) => {
  return (
    <div className={cx("input")}>
      <button
        type="button"
        className={cx("input-max")}
        onClick={setInvestmentMax}
      >
        MAX
      </button>
      <input
        type="text"
        className={cx("investment")}
        value={investmentAmount}
        onChange={e => {
          setStagedTransactionType("buy outcome tokens");
          setInvestmentAmount(e.target.value);
        }}
      />
      <span className={cx("input-right")}>{collateral.symbol}</span>
    </div>
  );
};

AmountInput.propTypes = {
  collateral: PropTypes.shape({
    contract: PropTypes.object.isRequired,
    name: PropTypes.string.isRequired,
    symbol: PropTypes.string.isRequired,
    decimals: PropTypes.number.isRequired,
    isWETH: PropTypes.bool.isRequired
  }).isRequired,
  setInvestmentMax: PropTypes.func.isRequired,
  investmentAmount: PropTypes.string,
  setStagedTransactionType: PropTypes.func.isRequired,
  setInvestmentAmount: PropTypes.func.isRequired
};

export default AmountInput;
