import React, { useCallback } from "react";
import { Form, Field } from "react-final-form";
import classnames from "classnames/bind";
import style from "../kyc.scss";
import Select from "components/Form/Select";

import { STEP_REJECTED, STEP_NATIONALITY, STEP_RESIDENCE } from "../";

const cx = classnames.bind(style);

const Nationality = ({ closeModal, handleAdvanceStep }) => {
  const onSubmit = useCallback(values => {
    handleAdvanceStep(values.is_eu_resident ? STEP_NATIONALITY : STEP_REJECTED);
  }, []);
  return (
    <>
      <div className={cx("modal-header")}>
        Create account
        <button
          type="button"
          onClick={closeModal}
          className={cx("modal-close")}
        />
      </div>
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
              handleAdvanceStep(STEP_REJECTED, { reason: "non-eu" })
            }
          >
            No
          </button>
        </div>
      </div>
    </>
  );
};

export default Nationality;
