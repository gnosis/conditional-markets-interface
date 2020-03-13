import React, { useCallback } from "react";
import PropTypes from "prop-types";
import Logo from "assets/img/emote_trade_limit.svg";
import Button from "@material-ui/core/Button";
import Link from "@material-ui/core/Link";
import Divider from "@material-ui/core/Divider";

import UpperBar from "./components/upperBar";
import Header from "./components/header";

import { postTier2Upgrade } from "api/whitelist";

import cn from "classnames/bind";

import style from "./tradeOverLimit.scss";

const cx = cn.bind(style);

const tradeOverLimit = ({
  closeModal,
  account,
  tier,
  volume,
  maxVolume,
  tradeValue,
  openModal
}) => {
  const handleTierUpgrade = useCallback(async values => {
    const personalDetails = {
      ...values
    };

    console.log("submitting:", values);

    // const [response, json] = await postTier2Upgrade(personalDetails);

    // if (!response.ok) {
    //   if (response.code === 400) {
    //     return json;
    //   } else if (response.code === 403) {
    //     return {
    //       [FORM_ERROR]:
    //         "Your address is already being processed. Please wait until your application has been approved."
    //     };
    //   } else {
    //     return {
    //       [FORM_ERROR]:
    //         "Unfortunately, the whitelisting API returned a non-standard error. Please try again later."
    //     };
    //   }
    // }
    openModal("KYC", {
      initialStep: "TIER2_REQUEST_SUCCESS",
      tier2Upgrade: "true"
    });
  }, []);

  const exceedValue = volume + tradeValue - maxVolume;
  return (
    <div className={cx(["modal", "over-limit-modal"])}>
      <UpperBar closeModal={closeModal} title="Trade limit"></UpperBar>
      <Header title="Tier 1 Trade Limit" logo={Logo}></Header>
      <div className={cx("modal-body")}>
        <p>Your requested trade exceeds your current trade limit:</p>
        <div className={cx("account-details")}>
          <div className={cx("account-details-element")}>
            <span>Wallet address:</span>
            <span className={cx("dotted-separator")}></span>
            <span>{account}</span>
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
              {volume}€ / <strong>{maxVolume}€</strong>
            </span>
          </div>
          <Divider className={cx("divider")} />
          <div className={cx("account-details-element")}>
            <span>Requested trade:</span>
            <span className={cx("dotted-separator")}></span>
            <span>{tradeValue}€</span>
          </div>
          <div className={cx("account-details-element")}>
            <span>
              <strong>Exceed amount:</strong>
            </span>
            <span className={cx("dotted-separator")}></span>
            <span>
              <strong>{exceedValue}€</strong>
            </span>
          </div>
        </div>
        <p>
          Upgrade to Tier 2 and trade up to 15.000€ by completing our expanded
          KYC process.
        </p>
        <Button
          className={cx("upgrade-button")}
          classes={{ label: cx("upgrade-button-label") }}
          variant="contained"
          color="primary"
          size="large"
          onClick={handleTierUpgrade}
          target="_BLANK"
          rel="noreferrer noopener"
        >
          Upgrade to Tier 2
        </Button>
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

tradeOverLimit.propTypes = {
  closeModal: PropTypes.func.isRequired,
  account: PropTypes.string,
  tier: PropTypes.number.isRequired,
  volume: PropTypes.number.isRequired,
  maxVolume: PropTypes.number.isRequired,
  tradeValue: PropTypes.number.isRequired
};

export default tradeOverLimit;
