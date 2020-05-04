import React, { useCallback } from "react";
import cn from "classnames/bind";

import Button from "@material-ui/core/Button";

import style from "../tier2.scss";
const cx = cn.bind(style);

const AlreadyVerified = () => {
  const goToMarkets = useCallback(() => {
    window.location.href = "https://sight.pm/#markets";
  });

  return (
    <div className={cx("step", "already-verified")}>
      <div className={cx("step-header")}>
        <p>KYC Tier Level 2 - Verification</p>
      </div>
      <p className={cx("step-description")}>
        Connected wallet is already KYC Tier Level 2 verified!
      </p>
      <Button
        className={cx("material-button", "big")}
        classes={{ label: cx("material-button-label") }}
        variant="contained"
        color="primary"
        size="large"
        type="submit"
        onClick={() => goToMarkets()}
      >
        Start Trading
      </Button>
    </div>
  );
};

export default AlreadyVerified;
