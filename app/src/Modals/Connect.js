import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import metamask from "assets/img/metamask-fox.svg";

import style from "./connect.scss";
import Web3 from "web3";
import { tryProvider } from "utils/web3";

const cx = cn.bind(style);

const Connect = ({ closeModal, reinit }) => {
  const [errorMessages, setErrorMessages] = useState({});
  const [validProvider, setValidProvider] = useState(false);

  const troubleshootMetamask = useCallback(async () => {
    const config = import(`../conf`);

    let account;
    try {
      const web3Data = await tryProvider(Web3.givenProvider, config.networkId);
      account = web3Data.account;
    } catch (err) {
      if (err.message === "provider not available") {
        setErrorMessages({
          METAMASK: {
            message: (
              <>
                <a
                  href="https://metamask.io"
                  target="_BLANK"
                  rel="noopener noreferrer"
                >
                  Please install Metamask
                </a>
              </>
            )
          }
        });
        return;
      }

      setErrorMessages({
        METAMASK: {
          message: err.message
        }
      });
      return;
    }

    // no account = locked
    if (!account) {
      setErrorMessages({
        METAMASK: {
          message: "Please unlock Metamask to continue."
        }
      });
    }

    setValidProvider(true);
  }, []);

  useEffect(() => {
    if (validProvider) {
      closeModal();
      reinit();
    }
  }, validProvider);

  return (
    <div className={cx("modal")}>
      <div className={cx("modal-header")}>
        <a href="#" className={cx("modal-close")} onClick={closeModal} />{" "}
        Connect with your Web3 wallet
      </div>
      <div className={cx("modal-body")}>
        <div className={cx("providers")}>
          <button
            className={cx("connect-card", "metamask")}
            type="button"
            onClick={troubleshootMetamask}
          >
            <img src={metamask} alt="Metamask" />
            <p className={cx("connect-card-header")}>Metamask</p>
            <p className={cx("connect-card-subheader")}>
              {errorMessages && errorMessages["METAMASK"]
                ? errorMessages["METAMASK"].message
                : "Connect with the Metamask wallet."}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

Connect.propTypes = {
  closeModal: PropTypes.func.isRequired,
  reinit: PropTypes.func.isRequired
};

export default Connect;
