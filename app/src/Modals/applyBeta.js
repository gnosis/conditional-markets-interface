import React from "react";
import PropTypes from "prop-types";
import Logo from "assets/icons/kyc-smiley.svg";
import Button from "@material-ui/core/Button";

import cn from "classnames/bind";

import style from "./applyBeta.scss";

const cx = cn.bind(style);

const getForUnregistered = () => {
  return (
    <>
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
    </>
  );
};

const getForWaitingVerification = () => {
  return (
    <p>
      Verification is still in progress for this account. You will be able to
      trade once the process finish.
    </p>
  );
};

const applyBeta = ({ closeModal, whitelistState }) => {
  return (
    <div className={cx(["modal", "apply-modal"])}>
      <div className={cx("modal-header")}>
        <a href="#" className={cx("modal-close")} onClick={closeModal}></a>{" "}
        <img className={cx("modal-header-image")} src={Logo} alt="kyc-logo" />
        <p>
          Apply for the <b>closed Beta</b>
        </p>
      </div>
      <div className={cx("modal-body")}>
        {!whitelistState || whitelistState === "NOT_FOUND"
          ? getForUnregistered()
          : getForWaitingVerification()}
      </div>
    </div>
  );
};

applyBeta.propTypes = {
  closeModal: PropTypes.func.isRequired,
  whitelistState: PropTypes.string
};

export default applyBeta;
