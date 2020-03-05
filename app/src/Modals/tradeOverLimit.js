import React from "react";
import PropTypes from "prop-types";
import Logo from "assets/icons/kyc-smiley.svg";
import Button from "@material-ui/core/Button";
import Link from "@material-ui/core/Link";

import cn from "classnames/bind";

import style from "./tradeOverLimit.scss";

const cx = cn.bind(style);

const tradeOverLimit = ({ closeModal, whitelistState }) => {
  return (
    <div className={cx(["modal", "over-limit-modal"])}>
      <div className={cx("modal-header")}>
        <span className={cx("modal-close")} onClick={closeModal}></span>{" "}
        <img className={cx("modal-header-image")} src={Logo} alt="kyc-logo" />
        <p>Tier 1 Trade Limit</p>
      </div>
      <div className={cx("modal-body")}>
        <p>Your requested trade exceeds your current trade limit:</p>
        <div className={cx("account-details")}></div>
        <p>
          Upgrade to Tier 2 and trade up to 15.000€ by completing our expanded
          KYC process.
        </p>
        <Button
          className={cx("upgrade-button")}
          classes={{ label: cx("upgrade-button-label") }}
          variant="contained"
          size="large"
          // href="http://eepurl.com/gAjo0X"
          target="_BLANK"
          rel="noreferrer noopener"
        >
          Upgrade to Tier 2
        </Button>
        <Link component="button" onClick={closeModal} underline="always">
          Cancel
        </Link>
      </div>
    </div>
  );
};

tradeOverLimit.propTypes = {
  closeModal: PropTypes.func.isRequired,
  whitelistState: PropTypes.string
};

export default tradeOverLimit;
