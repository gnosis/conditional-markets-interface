import React, { useCallback } from "react";
import PropTypes from "prop-types";
import Logo from "assets/icons/bell-warning.svg";
import Link from "@material-ui/core/Link";

import UpperBar from "../../components/upperBar";

import cn from "classnames/bind";

import style from "../kyc.scss";
import { STEP_TIER2_REQUEST } from "../";

const cx = cn.bind(style);

const Tier2RequestSuccess = ({
  closeModal,
  handleAdvanceStep,
  stepProps,
  email,
  tier2Upgrade
}) => {
  const handleRetry = useCallback(() => {
    if (tier2Upgrade) {
      const { openModal } = stepProps;
      openModal("tradeOverLimit", {
        ...stepProps
      });
    } else {
      handleAdvanceStep(STEP_TIER2_REQUEST);
    }
  });

  return (
    <>
      <UpperBar closeModal={closeModal} title="Documents pending"></UpperBar>
      <div className={cx("modal-body", "warning")}>
        <img className={cx("modal-jumbo")} src={Logo} alt="Warning!" />
        <div className={cx("modal-body-attention")}>
          Tier 2 Upgrade Pending: <strong>Documents upload required.</strong>
        </div>
        <p>
          Please check your email and follow KYC link to complete the proccess.
          Please make sure that you fulfilled all required information and check
          again the link as extra documents may be required. If the link is
          missing or expired{" "}
          <Link
            className={cx("cancel-button")}
            component="button"
            onClick={handleRetry}
            underline="always"
          >
            click here to resend.
          </Link>
        </p>
      </div>
    </>
  );
};

Tier2RequestSuccess.propTypes = {
  closeModal: PropTypes.func.isRequired,
  handleAdvanceStep: PropTypes.func.isRequired,
  email: PropTypes.string,
  tier2Upgrade: PropTypes.bool
};

export default Tier2RequestSuccess;
