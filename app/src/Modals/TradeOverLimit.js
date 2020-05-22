import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import Logo from "assets/img/emote_trade_limit.svg";
import Link from "@material-ui/core/Link";
import Divider from "@material-ui/core/Divider";

import useGlobalState from "hooks/useGlobalState";
import { formatAddress } from "utils/formatting";
import {
  isCurrentUserUpgrading,
  isCurrentUserActionRequired
} from "utils/tiers";

import UpperBar from "./components/upperBar";
import Header from "./components/header";
import Tier2Request from "./MyAccount/Tier2Request";
import Tier3Request from "./MyAccount/Tier3Request";
import TierUpgradeActionRequired from "./MyAccount/TierUpgradeActionRequired";
import TierUpgradePending from "./MyAccount/TierUpgradePending";

import cn from "classnames/bind";

import style from "./MyAccount/myAccount.scss";

const cx = cn.bind(style);

const TradeOverLimit = props => {
  const { account: address, user: userState, tiers } = useGlobalState();

  const { tier, volume, maxVolume, closeModal, showRequest } = props;

  const simulatedVolume = Number.parseFloat(volume);

  const [currentTradingVolume, setCurrentTradingVolume] = useState(0);
  const [showTierRequest, setShowTierRequest] = useState(showRequest || false);

  useEffect(() => {
    if (userState && userState.tradingVolume) {
      setCurrentTradingVolume(userState.tradingVolume.dollars);
    }
  }, [address, userState]);

  const handleRetry = useCallback(() => {
    setShowTierRequest(true);
  }, []);

  const tradeValue = simulatedVolume - Number.parseFloat(currentTradingVolume);
  const exceedValue = simulatedVolume - Number.parseFloat(maxVolume);

  return (
    <div className={cx("modal")}>
      <UpperBar closeModal={closeModal} title="Trade limit"></UpperBar>
      <Header title={"Tier " + tier + " Trade Limit"} logo={Logo}></Header>
      <div className={cx("modal-body")}>
        <p>Your requested trade exceeds your current trade limit:</p>
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
              ${simulatedVolume.toFixed(2)} / <strong>${maxVolume}</strong>
            </span>
          </div>
          <Divider className={cx("divider")} />
          <div className={cx("account-details-element")}>
            <span>Requested trade:</span>
            <span className={cx("dotted-separator")}></span>
            <span>${tradeValue.toFixed(2)}</span>
          </div>
          <div className={cx("account-details-element")}>
            <span>
              <strong>Exceed amount:</strong>
            </span>
            <span className={cx("dotted-separator")}></span>
            <span>
              <strong>${exceedValue.toFixed(2)}</strong>
            </span>
          </div>
        </div>
        {isCurrentUserActionRequired(tiers, userState) && !showTierRequest && (
          <TierUpgradeActionRequired
            handleRetry={handleRetry}
            tier={tier}
          ></TierUpgradeActionRequired>
        )}
        {tier < 2 &&
          ((!isCurrentUserActionRequired(tiers, userState) &&
            !isCurrentUserUpgrading(tiers, userState)) ||
            showTierRequest) && (
            <Tier2Request {...props} fromTradeOverLimit={true}></Tier2Request>
          )}
        {isCurrentUserUpgrading(tiers, userState) && (
          <TierUpgradePending tier={tier}></TierUpgradePending>
        )}
        {tier === 2 &&
          ((!isCurrentUserActionRequired(tiers, userState) &&
            !isCurrentUserUpgrading(tiers, userState)) ||
            showTierRequest) && (
            <Tier3Request {...props} fromTradeOverLimit={true}></Tier3Request>
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

TradeOverLimit.propTypes = {
  closeModal: PropTypes.func.isRequired,
  openModal: PropTypes.func.isRequired,
  address: PropTypes.string,
  tier: PropTypes.number.isRequired,
  volume: PropTypes.string.isRequired,
  maxVolume: PropTypes.number.isRequired,
  showRequest: PropTypes.bool
};

export default TradeOverLimit;
