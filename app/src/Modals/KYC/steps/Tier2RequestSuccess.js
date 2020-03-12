import React from "react";
import PropTypes from "prop-types";
import Logo from "assets/img/envelope_success.svg";
import Button from "@material-ui/core/Button";
import Link from "@material-ui/core/Link";

import UpperBar from "../../components/upperBar";
import Header from "../../components/header";

import cn from "classnames/bind";

import style from "../kyc.scss";

const cx = cn.bind(style);

const Tier2RequestSuccess = ({ closeModal, account }) => {
  return (
    <>
      <UpperBar closeModal={closeModal} title="Request sent"></UpperBar>
      <Header logo={Logo}></Header>
      <div className={cx("modal-body")}>
        <p>
          An email has been sent to <strong>email</strong>. Please follow the
          instructions in the email to complete the Tier 2 - KYC process.
        </p>
        <p>
          Make sure to check your spam folder.
          <Link
            className={cx("cancel-button")}
            component="button"
            onClick={closeModal}
            underline="always"
          >
            Click here to resend.
          </Link>
        </p>
        <Button
          className={cx("material-button")}
          classes={{ label: cx("material-button-label") }}
          variant="contained"
          color="primary"
          size="large"
          onClick={closeModal}
        >
          Done
        </Button>
      </div>
    </>
  );
};

Tier2RequestSuccess.propTypes = {
  closeModal: PropTypes.func.isRequired,
  account: PropTypes.string
};

export default Tier2RequestSuccess;
