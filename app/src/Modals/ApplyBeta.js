import React from "react";
import PropTypes from "prop-types";
import Logo from "assets/icons/kyc-smiley.svg";
import Button from "@material-ui/core/Button";

import cn from "classnames/bind";

import style from "./applyBeta.scss";

const cx = cn.bind(style);

const ApplyBeta = ({ closeModal }) => {
  return (
    <div className={cx(["modal", "apply-modal"])}>
      <div className={cx("modal-header")}>
        <a href="#" className={cx("modal-close")} onClick={closeModal}></a>{" "}
        <img className={cx("modal-header-image")} src={Logo} alt="kyc-logo" />
        Apply for the closed Beta
      </div>
      <div className={cx("modal-body")}>
        <p>
          To start trading positions you first need to whitelist your wallet
          address by applying for our closed Beta.
        </p>
        <Button
          className={cx("apply-button")}
          classes={{ label: cx("apply-button-label") }}
          variant="contained"
          size="large"
          href="http://eepurl.com/gAjo0X"
          target="_BLANK"
          rel="noreferrer noopener"
        >
          Apply Now
        </Button>
      </div>
    </div>
  );
};

ApplyBeta.propTypes = {
  closeModal: PropTypes.func.isRequired
};

export default ApplyBeta;
