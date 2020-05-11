import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import Logo from "assets/img/emote_trade_limit.svg";
import Link from "@material-ui/core/Link";
import Divider from "@material-ui/core/Divider";

import useGlobalState from "hooks/useGlobalState";
import { getCurrentTradingVolume } from "api/onboarding";
import { formatAddress } from "utils/formatting";
import {
  isCurrentUserUpgrading,
  isCurrentUserActionRequired
} from "utils/tiers";

import UpperBar from "./components/upperBar";
import Header from "./components/header";
import Tier2Request from "./MyAccount/Tier2Request";
import Tier2ActionRequired from "./MyAccount/Tier2ActionRequired";
import Tier2Pending from "./MyAccount/Tier2Pending";

import cn from "classnames/bind";

import style from "./MyAccount/myAccount.scss";

const cx = cn.bind(style);

const TradeOverLimit = props => {
  const { user: userState, tiers } = useGlobalState();

  const { address, tier, volume, maxVolume, closeModal, showRequest } = props;

  const simulatedVolume = Number.parseFloat(volume);

  const [currentTradingVolume, setCurrentTradingVolume] = useState(0);
  const [showTier2Request, setShowTier2Request] = useState(
    showRequest || false
  );

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
    setShowTier2Request(true);
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
        {isCurrentUserActionRequired(tiers, userState) && !showTier2Request && (
          <Tier2ActionRequired handleRetry={handleRetry}></Tier2ActionRequired>
        )}
        {tier < 2 &&
          ((!isCurrentUserActionRequired(tiers, userState) &&
            !isCurrentUserUpgrading(tiers, userState)) ||
            showTier2Request) && (
            <Tier2Request {...props} fromTradeOverLimit={true}></Tier2Request>
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
