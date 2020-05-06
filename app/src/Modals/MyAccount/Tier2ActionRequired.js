import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import Link from "@material-ui/core/Link";

import WarningLogo from "assets/icons/bell-warning.svg";

import cn from "classnames/bind";
import style from "./myAccount.scss";

const cx = cn.bind(style);

const Tier2ActionRequired = ({ handleRetry, tier2Upgrade }) => {
  return (
    <div className={cx("warning-block")}>
      <img src={WarningLogo} alt="Warning!" />
      <div className={cx("modal-body-attention")}>
        Tier 2 Upgrade Pending: <strong>Documents upload required.</strong>
      </div>
      <p>
        Please check your email and follow KYC link to complete the proccess.
        Please make sure that you fulfilled all required information and check
        again the link as extra documents may be required. If the link is
        missing or expired{" "}
        <Link
          className={cx("cancel-button")}
          component="button"
          onClick={handleRetry}
          underline="always"
        >
          click here to resend.
        </Link>
      </p>
    </div>
  );
};

Tier2ActionRequired.propTypes = {
  handleRetry: PropTypes.func.isRequired,
  tier2Upgrade: PropTypes.bool
};

export default Tier2ActionRequired;