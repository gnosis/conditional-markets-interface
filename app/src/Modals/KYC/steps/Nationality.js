import React, { useCallback, useState, useEffect } from "react";
import { Form, Field } from "react-final-form";
import classnames from "classnames/bind";
import style from "../kyc.scss";
import Select from "components/Form/Select";
import Spinner from "components/Spinner";

import { getResidenceCountries } from "api/whitelist";

import { STEP_REJECTED, STEP_PERSONAL } from "../";
import { isRequired, validator } from "utils/validations";

const cx = classnames.bind(style);

const FIELDS = {
  nationality: isRequired
};

const Nationality = ({ closeModal, updatePerson, handleAdvanceStep }) => {
  const [countries, setCountries] = useState();
  const [loadingState, setIsLoading] = useState("PENDING");

  const fetchCountries = useCallback(async () => {
    try {
      setIsLoading("PENDING");
      const countries = await getResidenceCountries();

      if (!countries) throw new Error("invalid response");

      setCountries(countries);
      setIsLoading("SUCCESS");
    } catch (e) {
      setIsLoading("FAILURE");
    }
  }, []);

  const onSubmit = useCallback(values => {
    updatePerson(prevValues => ({
      ...prevValues,
      countryNationalityIso2: values.nationality.value.iso2,
    }));

    handleAdvanceStep(
      values.nationality.value.canSdd ? STEP_PERSONAL : STEP_REJECTED
    );
  }, []);

  useEffect(() => {
    fetchCountries();
  }, []);

  if (loadingState === "PENDING") {
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
          <Spinner />;
        </div>
      </>
    );
  }

  if (loadingState === "FAILURE") {
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
          <p>Could not load country list. Please try again.</p>
          <button
            type="button"
            className={cx("field", "button")}
            onClick={fetchCountries}
          >
            Retry
          </button>
        </div>
      </>
    );
  }

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
          validate={validator(FIELDS)}
          render={({ handleSubmit }) => (
            <form onSubmit={handleSubmit}>
              <label className={cx("field", "label")}>
                Select your nationality:
              </label>
              <Field
                component={Select}
                name="nationality"
                className={cx("field", "select")}
                options={countries.map(nationality => ({
                  value: nationality,
                  label: nationality.name
                }))}
              />
              <button className={cx("field", "button", "primary")}>Next</button>
            </form>
          )}
        />
      </div>
    </>
  );
};

export default Nationality;
