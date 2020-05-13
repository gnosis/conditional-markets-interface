import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import Logo from "assets/img/emote_trade_limit.svg";
import Link from "@material-ui/core/Link";

import useGlobalState from "hooks/useGlobalState";
import { formatAddress } from "utils/formatting";
import {
  isCurrentUserUpgrading,
  isCurrentUserActionRequired
} from "utils/tiers";

import Tier2Request from "./Tier2Request";
import Tier2ActionRequired from "./Tier2ActionRequired";
import Tier2Pending from "./Tier2Pending";
import UpperBar from "../components/upperBar";
import Header from "../components/header";

import cn from "classnames/bind";
import style from "./myAccount.scss";

const cx = cn.bind(style);

const MyAccount = props => {
  const { account: address, user: userState, tiers } = useGlobalState();

  const { tier, maxVolume, closeModal, openModal, showRequest } = props;

  const [currentTradingVolume, setCurrentTradingVolume] = useState(0);
  const [showTier2Request, setShowTier2Request] = useState(
    showRequest || false
  );

  useEffect(() => {
    if (userState && userState.tradingVolume) {
      setCurrentTradingVolume(userState.tradingVolume.dollars);
    }
  }, [address, userState]);

  const handleRetry = useCallback(() => {
    if (tier === 1) {
      setShowTier2Request(true);
    } else {
      openModal("KYC", { initialStep: "TIER2_REQUEST" });
    }
  }, [openModal, tier]);

  return (
    <div className={cx("modal")}>
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
          ((!isCurrentUserActionRequired(tiers, userState) &&
            !isCurrentUserUpgrading(tiers, userState)) ||
            showTier2Request) && (
            <Tier2Request {...props} fromAccountDetails={true}></Tier2Request>
          )}
        {isCurrentUserUpgrading(tiers, userState) && (
          <Tier2Pending></Tier2Pending>
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
  tier: PropTypes.number.isRequired,
  maxVolume: PropTypes.number.isRequired,
  showRequest: PropTypes.bool
};

export default MyAccount;
