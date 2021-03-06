import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Form, Field } from "react-final-form";
import { FORM_ERROR } from "final-form";
import Button from "@material-ui/core/Button";
import { getMoment } from "utils/timeFormat";

import DateInput from "components/Form/DateInput";
import WalletInput from "components/Form/WalletInput";
import TextInput from "components/Form/TextInput";
import CheckboxInput from "components/Form/Checkbox";
import Select from "components/Form/Select";
import Captcha from "components/Form/Captcha";
import Spinner from "components/Spinner";

import UpperBar from "../../components/upperBar";

import { getResidenceCountries, postPersonalDetails } from "api/onboarding";

import cn from "classnames/bind";

import style from "../kyc.scss";
import {
  isRequired,
  validator,
  isEmail,
  isEqual
} from "../../../utils/validations";
import { STEP_PENDING } from "../";
import useGlobalState from "hooks/useGlobalState";

import TOS_DocumentURL from "assets/pdfs/TOS_SIGHT_JULY_2019.pdf";

const cx = cn.bind(style);

// email, country_residence(iso2), country_nationality(iso2), eth_address, id_document_type, id_document_number, document_expiry_date, first_name, middle_name (optional), last_name, address_line1, address_line2 (optional), postal_code, city
const VALIDATIONS = {
  idDocumentType: [isRequired],
  firstName: [isRequired],
  lastName: [isRequired],
  addressLine1: [isRequired],
  postalCode: [isRequired],
  city: [isRequired],
  countryResidence: [isRequired],
  idDocumentNumber: [isRequired],
  documentExpiryDate: [isRequired],
  birthDate: [isRequired],
  acceptTos: [isRequired],
  acceptPrivacy: [isRequired],
  email: [
    isRequired,
    isEmail,
    { func: isEqual, compareField: "emailConfirmation" }
  ],
  emailConfirmation: [
    isRequired,
    isEmail,
    { func: isEqual, compareField: "email" }
  ],
  recaptchaToken: [isRequired]
};

const Personal = ({ closeModal, person, updatePerson, handleAdvanceStep }) => {
  const { account } = useGlobalState();
  const [countries, setCountries] = useState();
  const [loadingState, setIsLoading] = useState("PENDING");
  const [maxBirthDate, setMaxBirthDate] = useState(new Date());

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

  const onSubmit = useCallback(
    async values => {
      const personalDetails = {
        ...values,
        ...person,
        documentExpiryDate: getMoment(values.documentExpiryDate).format(
          "Y-MM-DD"
        ),
        birthDate: getMoment(values.birthDate).format("Y-MM-DD"),
        countryResidenceIso2: values.countryResidence.iso2
      };

      updatePerson(personalDetails);

      const [response, json] = await postPersonalDetails(personalDetails);

      if (!response.ok) {
        if (response.code === 400) {
          return json;
        } else if (response.code === 403) {
          return {
            [FORM_ERROR]:
              "Your address is already being processed. Please wait until your application has been approved."
          };
        } else {
          return {
            [FORM_ERROR]:
              "Unfortunately, the whitelisting API returned a non-standard error. Please try again later."
          };
        }
      }

      handleAdvanceStep(STEP_PENDING);
    },
    [person]
  );

  useEffect(() => {
    fetchCountries();
    let eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    setMaxBirthDate(eighteenYearsAgo);
  }, []);

  if (loadingState === "PENDING") {
    return (
      <>
        <UpperBar closeModal={closeModal} title="Get Verified"></UpperBar>
        <div className={cx("modal-body")}>
          <Spinner />;
        </div>
      </>
    );
  }

  if (loadingState === "FAILURE") {
    return (
      <>
        <UpperBar closeModal={closeModal} title="Get Verified"></UpperBar>
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
      <UpperBar closeModal={closeModal} title="Get Verified"></UpperBar>
      <div className={cx("modal-body")}>
        <Form
          onSubmit={onSubmit}
          validate={validator(VALIDATIONS)}
          render={({ handleSubmit, submitError, submitting }) => (
            <form onSubmit={handleSubmit}>
              <p className={cx("field", "heading")}>
                Please provide your information and agree to our policies:
              </p>
              <div className={cx("panes")}>
                <div className={cx("pane", "left")}>
                  <label className={cx("field", "label")}>
                    Your ID document:
                  </label>
                  <Field
                    name="idDocumentType"
                    component={Select}
                    label={"Document Type*"}
                    options={[
                      { value: "passport", label: "Travel Passport" },
                      { value: "id-document", label: "ID Document" }
                    ]}
                  />
                  <Field
                    name="idDocumentNumber"
                    label="Document Number*"
                    component={TextInput}
                  />
                  <Field
                    name="documentExpiryDate"
                    label="Document Expiration"
                    disablePast
                    autoOk
                    component={DateInput}
                  />
                  <Field
                    name="firstName"
                    label="First Name*"
                    component={TextInput}
                  />
                  <Field
                    name="middleName"
                    label="Middle Name (optional)"
                    component={TextInput}
                  />
                  <Field
                    name="lastName"
                    label="Last Name*"
                    component={TextInput}
                  />
                  <Field
                    name="birthDate"
                    label="Date of Birth*"
                    // disableFuture
                    autoOk
                    openTo="year"
                    maxDate={maxBirthDate}
                    component={DateInput}
                  />
                </div>
                <div className={cx("pane", "right")}>
                  <label className={cx("field", "label")}>
                    Your personal details:
                  </label>

                  <Field
                    name="ethAddress"
                    label="Wallet address"
                    component={WalletInput}
                    readOnly
                    initialValue={account}
                  />
                  <Field
                    name="email"
                    label="E-mail Address*"
                    component={TextInput}
                  />
                  <Field
                    name="emailConfirmation"
                    label="Repeat E-mail Address*"
                    component={TextInput}
                  />
                  <Field
                    name="addressLine1"
                    label="Address Line 1*"
                    component={TextInput}
                  />
                  <Field
                    name="addressLine2"
                    label="Address Line 2 (optional)"
                    component={TextInput}
                  />

                  <div className={cx("field-group")}>
                    <Field
                      name="postalCode"
                      label="Postal Code*"
                      component={TextInput}
                    />
                    <Field name="city" label="City*" component={TextInput} />
                  </div>

                  <Field
                    name="countryResidence"
                    label="Country*"
                    component={Select}
                    options={countries
                      .filter(country => country.canSdd)
                      .map(nationality => ({
                        value: nationality,
                        label: nationality.name
                      }))}
                  />
                </div>
              </div>

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

              <Field name="recaptchaToken" component={Captcha} />

              {submitError && <p className={cx("error")}>{submitError}</p>}
              <Button
                className={cx("field", "material-button")}
                classes={{ label: cx("material-button-label") }}
                variant="contained"
                color="primary"
                size="large"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Please wait" : "Next"}
              </Button>
            </form>
          )}
        />
      </div>
    </>
  );
};

Personal.propTypes = {
  closeModal: PropTypes.func.isRequired,
  person: PropTypes.shape({}).isRequired,
  updatePerson: PropTypes.func.isRequired,
  handleAdvanceStep: PropTypes.func.isRequired
};

export default Personal;
