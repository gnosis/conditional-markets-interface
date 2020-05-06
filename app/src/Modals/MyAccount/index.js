import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import Logo from "assets/img/emote_trade_limit.svg";
import Button from "@material-ui/core/Button";
import Link from "@material-ui/core/Link";

import { Form, Field } from "react-final-form";
import { FORM_ERROR } from "final-form";

import { getCurrentTradingVolume, postTier2Upgrade } from "api/onboarding";
import { formatAddress } from "utils/formatting";
import {
  isCurrentUserUpgrading,
  isCurrentUserActionRequired
} from "utils/tiers";

import Tier2ActionRequired from "./Tier2ActionRequired";
import UpperBar from "../components/upperBar";
import Header from "../components/header";
import Captcha from "components/Form/Captcha";

import { isRequired, validator } from "../../utils/validations";

import cn from "classnames/bind";
import style from "./myAccount.scss";

const cx = cn.bind(style);

const VALIDATIONS = {
  recaptchaToken: [isRequired]
};

const MyAccount = props => {
  const {
    address,
    tier,
    maxVolume,
    closeModal,
    openModal,
    tiers,
    userState
  } = props;

  const [currentTradingVolume, setCurrentTradingVolume] = useState(0);
  const [showTier2Request, setShowTier2Request] = useState(false);

  const getTradingVolume = useCallback(() => {
    (async () => {
      const { buyVolume } = await getCurrentTradingVolume(address);

      setCurrentTradingVolume(buyVolume.dollars);
    })();
  }, [address]);

  useEffect(() => {
    getTradingVolume();
  }, []);

  const handleRetry = useCallback(() => {
    if (tier === 1) {
      setShowTier2Request(true);
    } else {
      openModal("KYC", { initialStep: "TIER2_REQUEST" });
    }
  }, [openModal, tier]);

  const onSubmit = useCallback(
    async values => {
      const personalDetails = {
        ethAddress: address,
        ...values
      };

      const [response, json] = await postTier2Upgrade(personalDetails);

      if (!response.ok) {
        if (response.code === 400) {
          return json;
        } else if (response.code === 403) {
          return {
            [FORM_ERROR]:
              "Your address is already being processed. Please wait until your application has been approved."
          };
        } else {
          return {
            [FORM_ERROR]:
              "Unfortunately, the whitelisting API returned a non-standard error. Please try again later."
          };
        }
      }

      openModal("KYC", {
        initialStep: "TIER2_REQUEST_SUCCESS",
        tier2Upgrade: "true",
        stepProps: props,
        address
      });
    },
    [address, openModal, props]
  );

  return (
    <div className={cx(["modal", "my-account-modal"])}>
      <UpperBar closeModal={closeModal} title="My account"></UpperBar>
      <Header logo={Logo}></Header>
      <div className={cx("modal-body")}>
        <div className={cx("account-details")}>
          <div className={cx("account-details-element")}>
            <span>Wallet address:</span>
            <span className={cx("dotted-separator")}></span>
            <span>{formatAddress(address)}</span>
          </div>
          <div className={cx("account-details-element")}>
            <span>Tier Level:</span>
            <span className={cx("dotted-separator")}></span>
            <span>{tier}</span>
          </div>
          <div className={cx("account-details-element")}>
            <span>Available trade limit:</span>
            <span className={cx("dotted-separator")}></span>
            <span>
              ${Number.parseFloat(currentTradingVolume).toFixed(2)} /{" "}
              <strong>${maxVolume}</strong>
            </span>
          </div>
        </div>
        {isCurrentUserActionRequired(tiers, userState) && !showTier2Request && (
          <Tier2ActionRequired handleRetry={handleRetry}></Tier2ActionRequired>
        )}
        {tier < 2 &&
          (!isCurrentUserActionRequired(tiers, userState) ||
            showTier2Request) && (
            <>
              <p>
                Upgrade to Tier 2 and trade up to $15.000 by completing our
                expanded KYC process.
              </p>

              <Form
                onSubmit={onSubmit}
                validate={validator(VALIDATIONS)}
                render={({ handleSubmit, submitError, submitting }) => (
                  <form onSubmit={handleSubmit}>
                    <Field
                      className={cx("field")}
                      name="recaptchaToken"
                      component={Captcha}
                    />
                    {submitError && (
                      <p className={cx("error")}>{submitError}</p>
                    )}
                    <Button
                      className={cx("field", "upgrade-button")}
                      classes={{ label: cx("upgrade-button-label") }}
                      disabled={submitting}
                      variant="contained"
                      color="primary"
                      size="large"
                      type="submit"
                    >
                      {submitting ? "Please wait" : "Upgrade to Tier 2"}
                    </Button>
                  </form>
                )}
              />
            </>
          )}
        <Link
          className={cx("cancel-button")}
          component="button"
          onClick={closeModal}
          underline="always"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
};

MyAccount.propTypes = {
  closeModal: PropTypes.func.isRequired,
  openModal: PropTypes.func.isRequired,
  address: PropTypes.string,
  tier: PropTypes.number.isRequired,
  maxVolume: PropTypes.number.isRequired,
  userState: PropTypes.object.isRequired,
  tiers: PropTypes.array.isRequired
};

export default MyAccount;
