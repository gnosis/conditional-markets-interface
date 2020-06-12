import React, { useCallback } from "react";
import Link from "@material-ui/core/Link";

import cn from "classnames/bind";

import style from "../tier2.scss";
const cx = cn.bind(style);

const TokenExpired = () => {
  const goToMarkets = useCallback(() => {
    window.location.href = "https://sight.pm/#markets";
  }, []);

  return (
    <div className={cx("step", "token-expired")}>
      <div className={cx("step-header")}>
        <p>KYC Tier Level 2 - Verification</p>
      </div>
      <p className={cx("step-description", "error")}>
        The link you followed has expired.
      </p>
      <p className={cx("step-description")}>
        Please request a new link through the trading interface at{" "}
        <Link
          className={cx("cancel-button")}
          component="button"
          onClick={goToMarkets}
          underline="always"
        >
          Sight.pm
        </Link>
      </p>
    </div>
  );
};

export default TokenExpired;
