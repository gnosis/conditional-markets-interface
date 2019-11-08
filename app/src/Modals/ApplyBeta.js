import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import style from "./applyBeta.scss";

const cx = cn.bind(style);

const ApplyBeta = ({ closeModal }) => {
  return (
    <div className={cx("modal")}>
      <div className={cx("modal-header")}>
        <a href="#" className={cx("modal-close")} onClick={closeModal}></a>{" "}
        Apply for the closed beta
      </div>
      <div className={cx("modal-body")}>
        <p>
          To start trading positions you first need to whitelist your wallet
          address by applying for our closed beta.
        </p>
        <a
          className={cx("link-button")}
          href="http://eepurl.com/gAjo0X"
          target="_BLANK"
          rel="noreferrer noopener"
        >
          Apply Now
        </a>
      </div>
    </div>
  );
};

ApplyBeta.propTypes = {
  closeModal: PropTypes.func.isRequired
};

export default ApplyBeta;
