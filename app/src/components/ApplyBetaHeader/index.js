import React from "react";
import PropTypes from "prop-types";
import Logo from "assets/icons/kyc-smiley.svg";

import cn from "classnames/bind";

import style from "./applyBetaHeader.scss";

const cx = cn.bind(style);

const ApplyBetaHeader = ({ openModal, whitelistState }) => {
  if (whitelistState === "NOT_FOUND") {
    return (
      <div className={cx("apply-banner")}>
        <img className={cx("apply-banner-image")} src={Logo} alt="kyc-logo" />
        <span className={cx("apply-banner-text")}>
          Start trading by whitelisting your wallet address.
        </span>
        <button
          type="button"
          className={cx("apply-banner-button")}
          onClick={() => openModal("ApplyBeta")}
        >
          Apply Now
        </button>
      </div>
    );
  }

  return null;
};

ApplyBetaHeader.propTypes = {
  openModal: PropTypes.func.isRequired,
  whitelistState: PropTypes.oneOf([
    "LOADING",
    "NOT_FOUND",
    "PENDING_KYC",
    "WHITELISTED",
    "BLOCKED",
    "ERROR",
    true
  ]).isRequired
};

export default ApplyBetaHeader;
