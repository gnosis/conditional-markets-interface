import React, { useCallback } from "react";
import PropTypes from "prop-types";
import Logo from "assets/img/envelope_success.svg";
import Button from "@material-ui/core/Button";
import Link from "@material-ui/core/Link";

import UpperBar from "../../components/upperBar";
import Header from "../../components/header";

import cn from "classnames/bind";

import style from "../kyc.scss";
import { STEP_TIER2_REQUEST } from "../";

const cx = cn.bind(style);

const Tier2RequestSuccess = ({
  openModal,
  closeModal,
  handleAdvanceStep,
  stepProps,
  email,
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
    } else {
      handleAdvanceStep(STEP_TIER2_REQUEST);
    }
  }, [
    fromAccountDetails,
    fromTradeOverLimit,
    handleAdvanceStep,
    openModal,
    stepProps
  ]);

  return (
    <>
      <UpperBar closeModal={closeModal} title="Request sent"></UpperBar>
      <Header logo={Logo}></Header>
      <div className={cx("modal-body")}>
        {email ? (
          <p>
            An email has been sent to <strong>{email}</strong>. Please follow
            the instructions in the email to complete the Tier 2 - KYC process.
          </p>
        ) : (
          <p>
            An email has been sent to to the address you used to register for
            Tier 1. Please follow the instructions in the email to complete the
            Tier 2 - KYC process.
          </p>
        )}
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

Tier2RequestSuccess.propTypes = {
  openModal: PropTypes.func.isRequired,
  closeModal: PropTypes.func.isRequired,
  handleAdvanceStep: PropTypes.func.isRequired,
  email: PropTypes.string,
  fromTradeOverLimit: PropTypes.bool,
  fromAccountDetails: PropTypes.bool
};

export default Tier2RequestSuccess;
