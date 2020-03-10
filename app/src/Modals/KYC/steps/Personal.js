import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Form, Field } from "react-final-form";
import { FORM_ERROR } from "final-form";
import { getMoment } from "utils/timeFormat";

import DateInput from "components/Form/DateInput";
import WalletInput from "components/Form/WalletInput";
import TextInput from "components/Form/TextInput";
import CheckboxInput from "components/Form/Checkbox";
import Select from "components/Form/Select";
import Captcha from "components/Form/Captcha";
import Spinner from "components/Spinner";

import { getResidenceCountries, postPersonalDetails } from "api/whitelist";

import cn from "classnames/bind";

import style from "../kyc.scss";
import { isRequired, validator, isEmail } from "../../../utils/validations";
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
  acceptTos: [isRequired],
  acceptPrivacy: [isRequired],
  email: [isRequired, isEmail],
  recaptchaToken: [isRequired]
};

const Personal = ({ closeModal, person, updatePerson, handleAdvanceStep }) => {
  const { account } = useGlobalState();
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

  const onSubmit = useCallback(
    async values => {
      const personalDetails = {
        ...values,
        ...person,
        idDocumentType: values.idDocumentType.value,
        documentExpiryDate: getMoment(values.documentExpiryDate).format(
          "Y-MM-DD"
        ),
        countryResidenceIso2: values.countryResidence.value.iso2
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
          validate={validator(VALIDATIONS)}
          render={({ handleSubmit, submitError, submitting }) => (
            <form onSubmit={handleSubmit}>
              <label className={cx("field", "heading")}>
                Please provider your information and agree to our policies:
              </label>

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
              <button disabled={submitting} className={cx("field", "button")}>
                {submitting ? "Please wait" : "Next"}
              </button>
            </form>
          )}
        />
      </div>
    </>
  );
};

Personal.propTypes = {
  closeModal: PropTypes.func.isRequired,
  person: PropTypes.func.isRequired,
  updatePerson: PropTypes.func.isRequired,
  handleAdvanceStep: PropTypes.func.isRequired
};

export default Personal;