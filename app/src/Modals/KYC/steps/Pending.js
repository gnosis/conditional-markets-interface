import React, { useCallback, useState, useEffect } from "react";
import PropTypes from "prop-types";
import classnames from "classnames/bind";
import style from "../kyc.scss";

import useGlobalState from "hooks/useGlobalState";

import useInterval from "@use-it/interval";

import UpperBar from "../../components/upperBar";

import { isTieredWhitelistProcessing } from "api/onboarding";
import { STEP_REJECTED, STEP_APPROVED } from "..";

const cx = classnames.bind(style);

const Pending = ({ closeModal, handleAdvanceStep, updateWhitelist }) => {
  const [checkedIndices, setCheckedIndices] = useState([false, false]);
  const [pageStatus, setPageStatus] = useState("PENDING");
  const { account } = useGlobalState();

  const [intervalDelay, setIntervalDelay] = useState(5000);

  const updateWhitelistStatus = useCallback(() => {
    if (!account) {
      return;
    }

    return (async () => {
      const status = await isTieredWhitelistProcessing(account);

      if (
        status["sanctionStatus"] === "ERROR" ||
        status["whitelistStatus"] === "ERROR"
      ) {
        setPageStatus("ERROR");
        setIntervalDelay(0);
        return;
      }

      let checkedIndices = [false, false];
      if (status["sanctionStatus"] === true) {
        checkedIndices[0] = true;
      }
      if (status["whitelistStatus"] === true) {
        checkedIndices[1] = true;
      }

      setCheckedIndices(checkedIndices);

      if (updateWhitelist) {
        // Update whitelist global state if user was blocked and whitelisted after approving
        updateWhitelist();
      }

      if (status["sanctionStatus"] && status["whitelistStatus"]) {
        handleAdvanceStep(
          status["rejected"]
            ? [STEP_REJECTED, { reason: "tier1check" }]
            : STEP_APPROVED
        );
        setIntervalDelay(0);
        return;
      }
    })();
  }, [account]);

  useEffect(() => {
    updateWhitelistStatus();
  }, []);

  useInterval(updateWhitelistStatus, intervalDelay);

  return (
    <>
      <UpperBar closeModal={closeModal} title="Create Account"></UpperBar>
      <div className={cx("modal-body")}>
        {pageStatus !== "ERROR" ? (
          <>
            <div className={cx("modal-textblock")}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="120"
                height="120"
                viewBox="-10 -10 140 140"
                className={cx("modal-jumbo", "emote-pending-anim")}
              >
                <g fill="none" fillRule="nonzero">
                  <path
                    fill="#00193C"
                    d="M60 0a59.771 59.771 0 0 0-20.869 3.73l1.739 4.688A54.867 54.867 0 0 1 60 5c30.328 0 55 24.672 55 55s-24.672 55-55 55C29.674 115 5 90.328 5 60c0-16.489 7.408-31.988 20-42.392V35h5V10H5v5h15.318A59.997 59.997 0 0 0 .001 60c0 33.081 26.918 60 60 60 33.081 0 60-26.919 60-60S93.082 0 60 0H60z"
                  />
                  <path
                    fill="#009CB4"
                    d="M45 80h-5v5h40v-5h-5v-8.535L63.535 60 75 48.535V40h5v-5H40v5h5v8.535L56.465 60 45 71.465V80zm5-33.535V40h20v6.465l-10 10-10-10zm10 17.07l10 10V80H50v-6.465l10-10z"
                  />
                  <path
                    fill="#00193C"
                    d="M45 95h5v5h-5zM57.5 95h5v5h-5zM70 95h5v5h-5z"
                  />
                </g>
              </svg>
            </div>
            <div>
              <div className={cx("modal-heading")}>
                Account creation in process...
              </div>

              <div className={cx("modal-well")}>
                {account ? (
                  <ul className={cx("checklist")}>
                    <li className={cx({ check: checkedIndices[0] })}>
                      Checking information against sanction list (~5 minutes)
                    </li>
                    <li className={cx({ check: checkedIndices[1] })}>
                      Adding address to whitelist (~5 minutes)
                    </li>
                  </ul>
                ) : (
                  <strong>
                    Something went wrong. Please reload the page and try again.
                  </strong>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className={cx("modal-textblock")}>
            <div className={cx("modal-heading")}>
              Unfortunately, we could not check your status at this time
            </div>
            <p>Please try again later or contact our support.</p>
          </div>
        )}
      </div>
    </>
  );
};

Pending.propTypes = {
  closeModal: PropTypes.func.isRequired,
  handleAdvanceStep: PropTypes.func.isRequired,
  updateWhitelist: PropTypes.func
};

export default Pending;
