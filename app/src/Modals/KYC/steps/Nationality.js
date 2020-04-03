import React, { useCallback, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Form, Field } from "react-final-form";
import classnames from "classnames/bind";
import Button from "@material-ui/core/Button";

import style from "../kyc.scss";
import Select from "components/Form/Select";
import Spinner from "components/Spinner";

import UpperBar from "../../components/upperBar";

import { getResidenceCountries } from "api/onboarding";

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
      countryNationalityIso2: values.nationality.value.iso2
    }));

    handleAdvanceStep(
      values.nationality.value.canSdd
        ? STEP_PERSONAL
        : [STEP_REJECTED, { reason: "nationality" }]
    );
  }, []);

  useEffect(() => {
    fetchCountries();
  }, []);

  if (loadingState === "PENDING") {
    return (
      <>
        <UpperBar closeModal={closeModal} title="Create Account"></UpperBar>
        <div className={cx("modal-body")}>
          <Spinner />;
        </div>
      </>
    );
  }

  if (loadingState === "FAILURE") {
    return (
      <>
        <UpperBar closeModal={closeModal} title="Create Account"></UpperBar>
        <div className={cx("modal-body")}>
          <p>Could not load country list. Please try again.</p>
          <Button
            className={cx("material-button")}
            classes={{ label: cx("material-button-label") }}
            variant="contained"
            size="large"
            onClick={fetchCountries}
          >
            Retry
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <UpperBar closeModal={closeModal} title="Create Account"></UpperBar>
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
              <Button
                className={cx("field", "material-button")}
                classes={{ label: cx("material-button-label") }}
                variant="contained"
                color="primary"
                size="large"
                type="submit"
              >
                Next
              </Button>
            </form>
          )}
        />
      </div>
    </>
  );
};
Nationality.propTypes = {
  closeModal: PropTypes.func.isRequired,
  handleAdvanceStep: PropTypes.func.isRequired,
  updatePerson: PropTypes.func.isRequired
};

export default Nationality;
