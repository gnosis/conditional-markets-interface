import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import style from "./applyBetaHeader.scss";

const cx = cn.bind(style);

const ApplyBetaHeader = ({ openModal, whitelistState }) => {
  // if (whitelistState === "LOADING") {
  //   return (
  //     <div className={cx("user-wallet")}>
  //       <Spinner />
  //     </div>
  //   );
  // }

  if (whitelistState === "NOT_FOUND") {
    return (
      <div className={cx("apply-banner")}>
        <span>Start trading by whitelisting your wallet address.</span>
        <button
          type="button"
          className={cx("apply-button")}
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
