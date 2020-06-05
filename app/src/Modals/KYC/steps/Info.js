import React from "react";
import PropTypes from "prop-types";
import classnames from "classnames/bind";
import Button from "@material-ui/core/Button";

import style from "../kyc.scss";

import UpperBar from "../../components/upperBar";

import { STEP_RESIDENCE } from "../";

const cx = classnames.bind(style);

const Info = ({ closeModal, handleAdvanceStep }) => {
  return (
    <>
      <UpperBar closeModal={closeModal} title="Create Account"></UpperBar>
      <div className={cx("modal-body", "full-width")}>
        <p className={cx("field", "tier-intro")}>
          By providing us with some basic information you can start buying
          positions with your connected wallet. The higher your tier level is,
          the higher the amounts are you can trade with on Sight&apos;s
          prediction markets.
        </p>
        <table className={cx("tier-table")}>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Annual Buy Limit</th>
              <th>Requirements</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tier 1</td>
              <td>$150</td>
              <td>
                <ul>
                  <li>Full name</li>
                  <li>Date of birth</li>
                  <li>Country of residence</li>
                  <li>Phone number</li>
                </ul>
              </td>
              <td>Not submitted</td>
            </tr>
            <tr>
              <td>Tier 2</td>
              <td>$15.000</td>
              <td>
                <ul>
                  <li>All of the above</li>
                  <li>Government issued ID</li>
                  <li>Proof of residence</li>
                  <li>Selfie</li>
                  <li>Source of funds</li>
                </ul>
              </td>
              <td>Not submitted</td>
            </tr>
            <tr>
              <td>Tier 3</td>
              <td>Unlimited</td>
              <td>
                <ul>
                  <li>All of the above</li>
                  <li>Verification of source of funds</li>
                </ul>
              </td>
              <td>Not submitted</td>
            </tr>
          </tbody>
        </table>
        <div className={cx("modal-buttons")}>
          <Button
            className={cx("material-button")}
            classes={{ label: cx("material-button-label") }}
            variant="contained"
            color="primary"
            size="large"
            onClick={() => handleAdvanceStep(STEP_RESIDENCE)}
          >
            Get Verified
          </Button>
        </div>
      </div>
    </>
  );
};

Info.propTypes = {
  closeModal: PropTypes.func.isRequired,
  handleAdvanceStep: PropTypes.func.isRequired
};

export default Info;
