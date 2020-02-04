import React, { useCallback } from "react";
import { Form, Field } from "react-final-form";
import classnames from "classnames/bind";
import style from "../kyc.scss";
import Select from "components/Form/Select";

import { STEP_REJECTED, STEP_PERSONAL } from "../";

const cx = classnames.bind(style);

const COUNTRIES = [
  {
    id: "123123123",
    name: "Germany",
    can_sdd: false,
    iso2: "DE",
    iso3: "DEU"
  },
  {
    id: "4553534",
    name: "French Polynesia	",
    can_sdd: false,
    iso2: "PF",
    iso3: "PFY"
  },
  {
    id: "359935485",
    name: "Luxembourg	",
    can_sdd: true,
    iso2: "LU",
    iso3: "LUX"
  },
  {
    id: "329039222",
    name: "Uzbekistan",
    can_sdd: true,
    iso2: "UZ",
    iso3: "UZB"
  }
];

const Nationality = ({ closeModal, updatePerson, handleAdvanceStep }) => {
  const onSubmit = useCallback(values => {
    console.log(values)
    updatePerson(prevValues => ({
      ...prevValues,
      nationality: values.nationality.value.id
    }));

    handleAdvanceStep(
      values.nationality.value.can_sdd ? STEP_PERSONAL : STEP_REJECTED
    );
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
              <label className={cx("field", "label")}>
                Select your nationality:
              </label>
              <Field
                component={Select}
                name="nationality"
                className={cx("field", "select")}
                options={COUNTRIES.map(({ id, name, can_sdd }) => ({
                  value: { id, can_sdd },
                  label: name
                }))}
              />
              <button className={cx("field", "button")}>Next</button>
            </form>
          )}
        />
      </div>
    </>
  );
};

export default Nationality;
