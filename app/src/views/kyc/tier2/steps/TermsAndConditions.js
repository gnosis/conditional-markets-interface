import React, { useCallback } from "react";
import cn from "classnames/bind";
import PropTypes from "prop-types";
import { Form, Field } from "react-final-form";
import { FORM_ERROR } from "final-form";

import Button from "@material-ui/core/Button";

import { STEP_SOURCE_OF_WEALTH } from "../";
import CheckboxInput from "components/Form/Checkbox";
import { isRequired, validator } from "utils/validations";

import style from "../tier2.scss";
const cx = cn.bind(style);

import TOS_DocumentURL from "assets/pdfs/TOS_SIGHT_JULY_2019.pdf";

const VALIDATIONS = {
  acceptTos: [isRequired],
  acceptPrivacy: [isRequired] //,
  // recaptchaToken: [isRequired]
};

const TermsAndConditions = ({ account, email, handleAdvanceStep }) => {
  const onSubmit = useCallback(async values => {
    console.log("Submitting...");
    console.log("values:", values);
    // const personalDetails = {
    //   ...values,
    //   ...person,
    //   documentExpiryDate: getMoment(values.documentExpiryDate).format(
    //     "Y-MM-DD"
    //   ),
    //   countryResidenceIso2: values.countryResidence.iso2
    // };

    // updatePerson(personalDetails);

    // const [response, json] = await postPersonalDetails(personalDetails);

    // if (!response.ok) {
    //   if (response.code === 400) {
    //     return json;
    //   } else if (response.code === 403) {
    //     return {
    //       [FORM_ERROR]:
    //         "Your address is already being processed. Please wait until your application has been approved."
    //     };
    //   } else {
    //     return {
    //       [FORM_ERROR]:
    //         "Unfortunately, the whitelisting API returned a non-standard error. Please try again later."
    //     };
    //   }
    // }

    handleAdvanceStep(STEP_SOURCE_OF_WEALTH);
  }, []);

  return (
    <div className={cx("step", "terms-and-conditions")}>
      <div className={cx("step-header")}>
        <p>KYC Tier Level 2 - Verification</p>
      </div>
      <div className={cx("step-sub-header")}>
        <p>You will be creating an account on Sight</p>
      </div>
      <p className={cx("step-description")}>
        This is the wallet address and email linked to your account. If you
        would like to register with a different wallet address, please connect
        with that wallet address now.
      </p>

      <div className={cx("user-details")}>
        <div className={cx("user-details-field")}>
          <span className={cx("user-details-title")}>Wallet address</span>
          <span className={cx("user-details-value")}>{account}</span>
        </div>
        <div className={cx("user-details-field")}>
          <span className={cx("user-details-title")}>E-mail address</span>
          <span className={cx("user-details-value")}>{email}</span>
        </div>
      </div>

      <Form
        onSubmit={onSubmit}
        validate={validator(VALIDATIONS)}
        render={({ handleSubmit, submitError, submitting }) => (
          <form onSubmit={handleSubmit}>
            <div className={cx("field-row")}>
              <Field
                name="acceptTos"
                component={CheckboxInput}
                type="checkbox"
                label={
                  <a
                    href={TOS_DocumentURL}
                    target="_BLANK"
                    rel="noreferrer noopener"
                  >
                    Terms & Conditions*
                  </a>
                }
              />
              <Field
                name="acceptPrivacy"
                component={CheckboxInput}
                type="checkbox"
                label={
                  <a
                    href="https://sight.pm/privacy.html"
                    target="_BLANK"
                    rel="noreferrer noopener"
                  >
                    Privacy Policy*
                  </a>
                }
              />
              <Field
                name="acceptNewsletter"
                component={CheckboxInput}
                type="checkbox"
                label="Newsletter & Updates"
              />
            </div>
            {submitError && <p className={cx("error")}>{submitError}</p>}
            <Button
              className={cx("field", "material-button", "big")}
              classes={{ label: cx("material-button-label") }}
              variant="contained"
              color="primary"
              size="large"
              type="submit"
              // disabled={submitting}
            >
              Proceed
            </Button>
          </form>
        )}
      />
    </div>
  );
};

TermsAndConditions.propTypes = {
  account: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  handleAdvanceStep: PropTypes.func.isRequired
};

export default TermsAndConditions;
