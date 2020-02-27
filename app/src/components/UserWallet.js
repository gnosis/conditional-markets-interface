import React, { useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";
import Web3Connect from "web3connect";
import WalletConnectProvider from "@walletconnect/web3-provider";

import useGlobalState from "hooks/useGlobalState";

import conf from "conf";

import Blockies from "react-blockies";
import Spinner from "components/Spinner";
import Balance from "./Balance";

import style from "./userWallet.scss";

const cx = cn.bind(style);

const formatAddress = address =>
  `${address.substr(0, 6)}...${address.substr(-4)}`;

const web3Connect = new Web3Connect.Core({
  network: conf.network,
  // cacheProvider: true,
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId: "d743990732244555a1a0e82d5ab90c7f"
      }
    }
  }
});

const UserWallet = ({
  //address,
  whitelistState,
  collateral,
  collateralBalance,
  setProvider,
  openModal
}) => {
  const { account: address } = useGlobalState();

  const connect = useCallback(
    provider => {
      setProvider(provider);
    },
    [setProvider]
  );

  const disconnect = () => {
    // web3Connect.clearCachedProvider();
    setProvider(null);
  };

  useEffect(() => {
    web3Connect.on("connect", connect);

    web3Connect.on("disconnect", () => {
      // disconnect();
    });

    web3Connect.on("close", () => {});
    // Cleanup on component destroy (contract reloading needs to recreate connect function)
    return function cleanupListener() {
      // Cleanup all litseners at once
      web3Connect.off("connect");
      web3Connect.off("disconnect");
      web3Connect.off("close");
    };
  }, []);

  if (!address) {
    return (
      <div className={cx("user-wallet")}>
        <button
          className={cx("connect-wallet")}
          onClick={() => web3Connect.toggleModal()}
        >
          Connect
        </button>
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

  if (whitelistState === "NOT_FOUND") {
    return (
      <div className={cx("user-wallet")}>
        <button onClick={() => openModal("KYC")} className={cx("kyc-button")}>
          Create Account
        </button>
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

  if (whitelistState === "PENDING_KYC" || whitelistState === "BLOCKED") {
    return (
      <div className={cx("user-wallet")}>
        <button
          type="button"
          className={cx("kyc-button", "whitelistStatus")}
          onClick={() => openModal("KYC", { step: "PENDING" })}
        >
          Verification in Progress for your Account
        </button>
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
  // address: PropTypes.string,
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
  setProvider: PropTypes.func.isRequired,
  openModal: PropTypes.func.isRequired
};

export default UserWallet;
