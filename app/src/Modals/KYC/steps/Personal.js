import React, { useCallback } from "react";
import { Form, Field } from "react-final-form";
import TextInput from "components/Form/TextInput";

import cn from "classnames/bind";

import style from "../kyc.scss";

const cx = cn.bind(style);

const Personal = ({ closeModal, updatePerson, handleAdvanceStep }) => {
  const onSubmit = useCallback(values => {
    console.log(values);
    updatePerson(prevValues => ({
      ...prevValues,
      nationality: values.nationality.value.id
    }));

    //handleAdvanceStep(
    //  values.nationality.value.can_sdd ? STEP_PERSONAL : STEP_REJECTED
    //);
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
        <Form
          onSubmit={onSubmit}
          render={({ handleSubmit }) => (
            <form onSubmit={handleSubmit}>
              <label className={cx("field", "heading")}>
                Please provider your information and agree to our policies:
              </label>

              <div className={cx("panes")}>
                <div className={cx("pane", "left")}>
                  <label className={cx("field", "label")}>
                    Your ID document:
                  </label>
                  <Field name="documentType" component={TextInput} />
                  <Field name="documentNumber" component={TextInput} />
                </div>
                <div className={cx("pane", "right")}>
                  <label className={cx("field", "label")}>
                    Your personal details:
                  </label>

                  <Field name="walletAddress" component={TextInput} />
                  <Field name="email" component={TextInput} />
                </div>
              </div>

              <button className={cx("field", "button")}>Next</button>
            </form>
          )}
        />
      </div>
    </>
  );
};

export default Personal;
