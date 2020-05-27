import React, { useCallback } from "react";
import PropTypes from "prop-types";
import Logo from "assets/img/envelope_success.svg";
import Button from "@material-ui/core/Button";
import Link from "@material-ui/core/Link";

import UpperBar from "../../components/upperBar";
import Header from "../../components/header";

import cn from "classnames/bind";

import style from "../kyc.scss";

const cx = cn.bind(style);

const Tier3RequestSuccess = ({
  openModal,
  closeModal,
  stepProps,
  fromTradeOverLimit,
  fromAccountDetails
}) => {
  const handleRetry = useCallback(() => {
    if (fromTradeOverLimit) {
      openModal("TradeOverLimit", {
        ...stepProps,
        showRequest: true
      });
    } else if (fromAccountDetails) {
      openModal("MyAccount", { ...stepProps, showRequest: true });
    }
  }, [fromAccountDetails, fromTradeOverLimit, openModal, stepProps]);

  return (
    <>
      <UpperBar closeModal={closeModal} title="Request sent"></UpperBar>
      <Header logo={Logo}></Header>
      <div className={cx("modal-body")}>
        <p>
          An email has been sent to to the address you used to register for Tier
          2. Please follow the instructions in the email to complete the Tier3 -
          KYC process.
        </p>
        <p>
          Make sure to check your spam folder.{" "}
          <Link
            className={cx("resend-button")}
            component="button"
            onClick={handleRetry}
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

Tier3RequestSuccess.propTypes = {
  openModal: PropTypes.func.isRequired,
  closeModal: PropTypes.func.isRequired,
  fromTradeOverLimit: PropTypes.bool,
  fromAccountDetails: PropTypes.bool
};

export default Tier3RequestSuccess;
