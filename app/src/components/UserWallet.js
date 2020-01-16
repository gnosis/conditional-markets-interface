import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";
import Web3Connect from "web3connect";
import WalletConnectProvider from "@walletconnect/web3-provider";

import Blockies from "react-blockies";
import Spinner from "components/Spinner";
import Balance from "./Balance";

import style from "./userWallet.scss";

const cx = cn.bind(style);

const formatAddress = address =>
  `${address.substr(0, 6)}...${address.substr(-4)}`;

const UserWallet = ({
  address,
  whitelistState,
  collateral,
  collateralBalance,
  setProvider
}) => {
  const connect = provider => {
    setProvider(provider);
  };

  const disconnect = () => {
    setProvider(null);
  };

  if (!address) {
    return (
      <div className={cx("user-wallet")}>
        <Web3Connect.Button
          className={cx("connect-wallet")}
          network="rinkeby" // TO-DO set current network
          providerOptions={{
            walletconnect: {
              package: WalletConnectProvider,
              options: {
                infuraId: "d743990732244555a1a0e82d5ab90c7f" //process.env.REACT_APP_INFURA_TOKEN
              }
            }
          }}
          onConnect={provider => {
            connect(provider);
          }}
          onDisconnect={() => {
            disconnect();
          }}
        />
      </div>
    );
  }

  if (whitelistState === "LOADING") {
    return (
      <div className={cx("user-wallet")}>
        <Spinner />
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
        <button onClick={disconnect} className={cx("disconnect-wallet")}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className={cx("user-wallet")}>
      <strong>
        <Balance
          collateral={collateral}
          collateralBalance={collateralBalance}
        />
      </strong>
      <span>&nbsp;–&nbsp;</span>
      <span className={cx("address")} title={address}>
        {formatAddress(address)}
      </span>
      <div className={cx("avatar")}>
        <Blockies
          seed={address.toLowerCase()}
          size={8}
          scale={16}
          className={cx("avatar-image")}
        />
      </div>
      <button onClick={disconnect} className={cx("disconnect-wallet")}>
        Disconnect
      </button>
    </div>
  );
};

UserWallet.propTypes = {
  address: PropTypes.string,
  whitelistState: PropTypes.oneOf([
    "LOADING",
    "NOT_FOUND",
    "PENDING_KYC",
    "WHITELISTED",
    "BLOCKED",
    "ERROR",
    true
  ]).isRequired,
  collateral: PropTypes.shape({
    fromUnitsMultiplier: PropTypes.object,
    symbol: PropTypes.string
  }).isRequired,
  collateralBalance: PropTypes.shape({
    totalAmount: PropTypes.object // DecimalJS
  }),
  setProvider: PropTypes.func.isRequired
};

export default UserWallet;
