import React, { useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";
import Web3Modal from "web3modal";
import Blockies from "react-blockies";

import WalletConnectProvider from "@walletconnect/web3-provider";

import useGlobalState from "hooks/useGlobalState";

import conf from "conf";

import { WHITELIST_STATES, WHITELIST_TIER_STATES } from "api/onboarding";
import Spinner from "components/Spinner";
import Balance from "./Balance";

import style from "./userWallet.scss";

const ONBOARDING_MODE = conf.ONBOARDING_MODE;
const accountsEnabled = ONBOARDING_MODE === "TIERED";

const cx = cn.bind(style);

const formatAddress = address =>
  `${address.substr(0, 6)}...${address.substr(-4)}`;

const web3Modal = new Web3Modal({
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
    // web3Modal.clearCachedProvider();
    setProvider(null);
  };

  useEffect(() => {
    web3Modal.on("connect", connect);

    web3Modal.on("disconnect", () => {
      // disconnect();
    });

    web3Modal.on("close", () => {});
    // Cleanup on component destroy (contract reloading needs to recreate connect function)
    return function cleanupListener() {
      // Cleanup all litseners at once
      web3Modal.off("connect");
      web3Modal.off("disconnect");
      web3Modal.off("close");
    };
  }, []);

  if (!address) {
    return (
      <div className={cx("user-wallet")}>
        <button
          className={cx("connect-wallet")}
          onClick={() => web3Modal.toggleModal()}
        >
          Connect
        </button>
      </div>
    );
  }

  if (ONBOARDING_MODE !== "disabled") {
    // All whitelist modes should have atleast these states:
    // - LOADING
    // - ERROR
    // - NOT FOUND (Neither approved nor denied, simply unknown user, must apply/register)
    // - PENDING_KYC (Process is pending)
    // - BLOCKED (No trading allowed)
    // - WHITELISTED

    if (whitelistState === WHITELIST_STATES.LOADING) {
      return (
        <div className={cx("user-wallet")}>
          <Spinner />
        </div>
      );
    }

    if (whitelistState === WHITELIST_STATES.ERROR) {
      return (
        <div className={cx("user-wallet")}>
          <span>An error occured. Please try again later.</span>
        </div>
      );
    }

    if (whitelistState === WHITELIST_STATES.UNKNOWN) {
      return (
        <div className={cx("user-wallet")}>
          {accountsEnabled && (
            <button
              onClick={() => openModal("KYC")}
              className={cx("kyc-button")}
            >
              Create Account
            </button>
          )}
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

    if (
      whitelistState === WHITELIST_STATES.PENDING ||
      whitelistState === WHITELIST_STATES.BLOCKED
    ) {
      return (
        <div className={cx("user-wallet")}>
          {accountsEnabled && (
            <button
              type="button"
              className={cx("kyc-button", "whitelistStatus")}
              onClick={() => openModal("KYC", { initialStep: "PENDING" })}
            >
              Verification in Progress for your Account
            </button>
          )}
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
  whitelistState: PropTypes.oneOf(WHITELIST_STATES).isRequired,
  collateral: PropTypes.shape({
    fromUnitsMultiplier: PropTypes.object,
    symbol: PropTypes.string
  }),
  collateralBalance: PropTypes.shape({
    totalAmount: PropTypes.object // DecimalJS
  }),
  setProvider: PropTypes.func.isRequired,
  openModal: PropTypes.func.isRequired
};

export default UserWallet;
