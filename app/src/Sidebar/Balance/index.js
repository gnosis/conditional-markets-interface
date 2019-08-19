import React from "react";

import { formatCollateral } from "utils/formatting";
import { zeroDecimal } from "utils/constants";

import cn from "classnames/bind";
import style from "./balance.scss";

const cx = cn.bind(style);

const Balance = ({ collateral, collateralBalance }) => {
  return (
    <div className={cx("balance")}>
      <div className={cx("label")}>Wallet Balance</div>
      <div className={cx("value")}>
        {formatCollateral(
          collateralBalance ? collateralBalance.totalAmount : zeroDecimal,
          collateral
        )}
      </div>
    </div>
  );
};

export default Balance;
