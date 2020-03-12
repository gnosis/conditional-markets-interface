import React from "react";
import PropTypes from "prop-types";
import classnames from "classnames/bind";
import style from "../kyc.scss";

import UpperBar from "../../components/upperBar";

import { STEP_TIER2_REQUEST, STEP_NATIONALITY } from "../";

const cx = classnames.bind(style);

const Residence = ({ closeModal, handleAdvanceStep }) => {
  return (
    <>
      <UpperBar closeModal={closeModal} title="Create Account"></UpperBar>
      <div className={cx("modal-body")}>
        <label className={cx("field", "heading")}>
          To start trading on Sight you first need to create an account:
        </label>
        <br />
        <label className={cx("field", "label")}>Are you a EU resident?</label>
        <br />
        <div className={cx("modal-buttons")}>
          <button
            type="button"
            className={cx("field", "button", "primary")}
            onClick={() => handleAdvanceStep(STEP_NATIONALITY)}
          >
            Yes
          </button>
          <button
            type="button"
            className={cx("field", "button", "secondary")}
            onClick={() =>
              handleAdvanceStep([
                STEP_TIER2_REQUEST,
                {
                  nonEuResident: true
                }
              ])
            }
          >
            No
          </button>
        </div>
      </div>
    </>
  );
};

Residence.propTypes = {
  closeModal: PropTypes.func.isRequired,
  handleAdvanceStep: PropTypes.func.isRequired
};

export default Residence;
