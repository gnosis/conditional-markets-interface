import React from "react";
import PropTypes from "prop-types";
import Link from "@material-ui/core/Link";

import WarningLogo from "assets/icons/bell-warning.svg";

import cn from "classnames/bind";
import style from "./myAccount.scss";

const cx = cn.bind(style);

const Tier2Message = ({ handleRetry }) => {
  return (
    <p>
      Please check your email and follow KYC link to complete the proccess.
      Please make sure that you fulfilled all required information and check
      again the link as extra documents may be required. If the link is missing
      or expired{" "}
      <Link
        className={cx("resend-button")}
        component="button"
        onClick={handleRetry}
        underline="always"
      >
        click here to resend.
      </Link>
    </p>
  );
};

const Tier3Message = ({ handleRetry }) => {
  return (
    <p>
      Please check your email and follow the instructions to complete the
      proccess. Please make sure to send all required information. If the link
      is missing or expired{" "}
      <Link
        className={cx("resend-button")}
        component="button"
        onClick={handleRetry}
        underline="always"
      >
        click here to resend.
      </Link>
    </p>
  );
};

const TierUpgradeActionRequired = ({ handleRetry, tier }) => {
  const minimumTier = 2;
  return (
    <div className={cx("warning-block")}>
      <img src={WarningLogo} alt="Warning!" />
      <div className={cx("modal-body-attention")}>
        Tier {tier + 1 < minimumTier ? minimumTier : tier + 1} Upgrade Pending:
        <strong> Documents upload required.</strong>
      </div>
      {tier < 2 && Tier2Message({ handleRetry })}
      {tier === 2 && Tier3Message({ handleRetry })}
    </div>
  );
};

TierUpgradeActionRequired.propTypes = {
  handleRetry: PropTypes.func.isRequired,
  tier: PropTypes.number.isRequired
};

export default TierUpgradeActionRequired;
