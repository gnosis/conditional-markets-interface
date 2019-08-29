import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import Blockies from "react-blockies";

import style from "./userWallet.scss";

const cx = cn.bind(style);

const formatAddress = address =>
  `${address.substr(0, 6)}...${address.substr(-4)}`;

const UserWallet = ({ address, openModal }) => (
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
        <button type="button" className={cx("connect-wallet")} onClick={(e) => openModal("Connect")}>
          Connect
        </button>
      </div>
    )}
  </div>
);

UserWallet.propTypes = {
  address: PropTypes.string
};

export default UserWallet;
