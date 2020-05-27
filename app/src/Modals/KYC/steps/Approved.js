import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import classnames from "classnames/bind";
import Button from "@material-ui/core/Button";

import { formatAddress } from "utils/formatting";
import { getCurrentUserTierData } from "utils/tiers";

import style from "../kyc.scss";

import UpperBar from "../../components/upperBar";

import EmotePending from "assets/img/emote_approve.svg";

const cx = classnames.bind(style);
import useGlobalState from "hooks/useGlobalState";

const Approved = ({ closeModal }) => {
  const { account, user, tiers } = useGlobalState();

  const [volume, setVolume] = useState(0);
  const [tierName, setTierName] = useState(0);
  const [tierLimit, setTierLimit] = useState(0);

  const updateCurrentUserTierData = useCallback(() => {
    const { name, limit } = getCurrentUserTierData(tiers, user);
    setTierName(name);
    setTierLimit(limit);
  }, [tiers, user]);

  useEffect(() => {
    updateCurrentUserTierData();
  }, []);

  useEffect(() => {
    if (user && user.tradingVolume) {
      setVolume(user.tradingVolume.dollars);
    }
  }, [account, user]);

  return (
    <>
      <UpperBar closeModal={closeModal} title="Create Account"></UpperBar>
      <div className={cx("modal-body")}>
        <img
          className={cx("modal-jumbo")}
          src={EmotePending}
          alt="Pending Verification"
        />
        <div>
          <div className={cx("modal-heading")}>Application approved!</div>

          <div className={cx("modal-well")}>
            <div className={cx("connected-items")}>
              <div className={cx("entry")}>
                <div className={cx("label")}>Wallet Address</div>
                <div className={cx("dots")} />
                <div className={cx("value")}>{formatAddress(account)}</div>
              </div>
              <div className={cx("entry")}>
                <div className={cx("label")}>Tier Level</div>
                <div className={cx("dots")} />
                <div className={cx("value")}>{tierName}</div>
              </div>
              <div className={cx("entry")}>
                <div className={cx("label")}>Available trade limit</div>
                <div className={cx("dots")} />
                <div className={cx("value")}>
                  ${Number.parseFloat(volume).toFixed(2)} /{" "}
                  <strong>${tierLimit}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className={cx("modal-textblock")}>
            <p>
              Your application has been approved and you&apos;ve been upgraded
              to <strong>Tier {tierName}</strong>. You may now buy outcome
              tokens with a value up to ${tierLimit}.
            </p>
            <p>
              We&apos;ve sent you an e-mail to subscribe to Sight notifications
              to receive updates about new markets and news.
            </p>
          </div>
          <Button
            className={cx("material-button")}
            classes={{ label: cx("material-button-label") }}
            variant="contained"
            color="primary"
            size="large"
            onClick={closeModal}
          >
            Continue Trading
          </Button>
        </div>
      </div>
    </>
  );
};

Approved.propTypes = {
  closeModal: PropTypes.func.isRequired
};

export default Approved;
