import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import Blockies from "react-blockies";
import Spinner from "components/Spinner";

import style from "./userWallet.scss";

const cx = cn.bind(style);

const formatAddress = address =>
  `${address.substr(0, 6)}...${address.substr(-4)}`;

const UserWallet = ({ address, openModal, whitelistState }) => {
  if (whitelistState === "LOADING") {
    return (
      <div className={cx("user-wallet")}>
        <Spinner />
      </div>
    );
  }

  if (whitelistState === "NOT_FOUND") {
    return (
      <div className={cx("user-wallet")}>
        <a
          className={cx("link-button")}
          href="http://eepurl.com/gAjo0X"
          target="_BLANK"
          rel="noreferrer noopener"
        >
          Sign Up for our closed Beta
        </a>
      </div>
    );
  }

  if (whitelistState === "ERROR") {
    return (
      <div className={cx("user-wallet")}>
        <span>An error occured. Please try again later.</span>
      </div>
    );
  }

  if (whitelistState === "PENDING_KYC" || whitelistState === "BLOCKED") {
    return (
      <div className={cx("user-wallet")}>
        <span className={cx("whitelistStatus")}>
          Verification in Progress for your Account
        </span>
        <span title={address}>{formatAddress(address)}</span>
        <div className={cx("avatar")}>
          <Blockies
            seed={address.toLowerCase()}
            size={8}
            scale={16}
            className={cx("avatar-image")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cx("user-wallet")}>
      {address ? (
        <>
          <span title={address}>{formatAddress(address)}</span>
          <div className={cx("avatar")}>
            <Blockies
              seed={address.toLowerCase()}
              size={8}
              scale={16}
              className={cx("avatar-image")}
            />
          </div>
        </>
      ) : (
        <div>
          <button
            type="button"
            className={cx("connect-wallet")}
            onClick={() => openModal("Connect")}
          >
            Connect
          </button>
        </div>
      )}
    </div>
  );
};

UserWallet.propTypes = {
  address: PropTypes.string.isRequired,
  openModal: PropTypes.func.isRequired,
  whitelistState: PropTypes.oneOf([
    "LOADING",
    "NOT_FOUND",
    "PENDING_KYC",
    "WHITELISTED",
    "BLOCKED",
    "ERROR",
    true
  ]).isRequired
};

export default UserWallet;
