import React, { useCallback, useEffect } from "react";
import { Form, Field } from "react-final-form";
import { FORM_ERROR } from "final-form";

import Button from "@material-ui/core/Button";
import { getSourceOfWealthState, setSourceOfFunds } from "api/onboarding";
import PropTypes from "prop-types";
import cn from "classnames/bind";
import styles from "../tier2.scss";

import EmoteSad from "assets/img/emote_sad.svg";

import Spinner from "components/Spinner";
import Select from "components/Form/Select";
import TextInput from "components/Form/TextInput";

import { STEP_SUMSUB_FORM } from "../";

const cx = cn.bind(styles);

import { isRequired, validator, fieldValidator } from "utils/validations";

const SOURCE_OF_WEALTH_OPTIONS = [
  { value: "salaried", label: "Emploment income (salaried)" },
  { value: "self-employed", label: "Employment income (self-employed)" },
  { value: "gift", label: "Gift" },
  { value: "investments-income", label: "Income from Investments" },
  { value: "tax-rebates", label: "Tax Rebates" },
  { value: "cryptocurrency-trading", label: "Cryptocurrency Trading" },
  {
    value: "investments",
    label:
      "Proceeds from sale of investments/liquidation of investment portfolio"
  },
  { value: "property-sale", label: "Proceeds from sale of property" },
  {
    value: "company-earnings",
    label: "Proceeds from sale of company or interest in a company"
  },
  { value: "rental-income", label: "Rental Income" },
  { value: "other", label: "Other" }
];

const DOES_NOT_REQUIRE_SPECIFICS = [
  "salaried",
  "self-employed",
  "company-earnings",
  "pension"
];

const VALIDATIONS = {
  mainSource: isRequired,
  expectedAnnualTradingVolume: isRequired
};

const SourceOfWealth = ({ email, account, handleAdvanceStep }) => {
  const checkSowState = useCallback(async () => {
    // Check if user already completed SOW form and go to next step
    const response = await getSourceOfWealthState(account);

    if (response.ok) {
      const json = await response.json();
      console.log("Json", json);
      if (json.available) {
        handleAdvanceStep(STEP_SUMSUB_FORM);
      }
    }
  }, [account, handleAdvanceStep]);

  useEffect(() => {
    checkSowState();
  }, []);

  const submitSOW = useCallback(
    async values => {
      const response = await setSourceOfFunds(values);

      if (response.ok) {
        handleAdvanceStep(STEP_SUMSUB_FORM);
      } else {
        if (response.status === 400) {
          return { [FORM_ERROR]: "Missing Data in Source of Funds request" };
        } else if (response.status === 401) {
          return { [FORM_ERROR]: "Error: KYC was already sent for this email" };
        } else if (response.status === 404) {
          return {
            [FORM_ERROR]: "Error: Your E-Mail was not found for our KYC process"
          };
        } else {
          return {
            [FORM_ERROR]: "An unknown error occurred. Please try again later"
          };
        }
      }
    },
    [handleAdvanceStep]
  );

  if (!email) {
    return (
      <>
        <div className={cx("modal-body")}>
          <div className={cx("modal-textblock")}>
            <img className={cx("modal-jumbo")} src={EmoteSad} alt="Sorry! :(" />
            <p>
              It looks like you followed a bad link. Please ensure you&apos;re
              using the correct link.
            </p>
          </div>
          <div>
            <Button
              className={cx("material-button", "big")}
              classes={{ label: cx("material-button-label") }}
              variant="contained"
              color="primary"
              size="large"
            >
              Close
            </Button>
          </div>
        </div>
        <Spinner />
      </>
    );
  }

  return (
    <>
      <div className={cx("step", "source-of-wealth")}>
        <div className={cx("step-header")}>
          <p>KYC Tier Level 2 - Verification</p>
        </div>
        <p className={cx("step-description")}>
          To be regulated under Gibraltar&apos; Distributed Ledger Technology
          (DTL) framework we are required to collect information on your source
          of funds.
        </p>
        <Form
          onSubmit={submitSOW}
          validate={validator(VALIDATIONS)}
          render={({ handleSubmit, values, submitError, submitting }) => {
            const showCompanyNameField =
              values.mainSource === "company-earnings";
            const showPensionTypeField = values.mainSource === "pension";
            const showEmployerJobField = values.mainSource === "salaried";
            const showSelfEmployedJobField =
              values.mainSource === "self-employed";
            const showSpecificsField =
              values.mainSource !== undefined &&
              !DOES_NOT_REQUIRE_SPECIFICS.includes(values.mainSource);

            if (submitting) {
              return <Spinner inverted />;
            }

            return (
              <form onSubmit={handleSubmit}>
                <br />
                <Field
                  component="input"
                  type="hidden"
                  name="email"
                  initialValue={email}
                />
                <Field
                  component={Select}
                  name="mainSource"
                  options={SOURCE_OF_WEALTH_OPTIONS}
                  label="Please select source of funds"
                />
                {showCompanyNameField && (
                  <Field
                    component={TextInput}
                    validate={fieldValidator([isRequired])}
                    name="saleCompanyName"
                    label="Please insert the name of the company"
                  />
                )}
                {showPensionTypeField && (
                  <Field
                    component={Select}
                    validate={fieldValidator([isRequired])}
                    name="pension"
                    options={[
                      { label: "Private", value: "private" },
                      { label: "Government Pension", value: "government" }
                    ]}
                  />
                )}
                {showSpecificsField && (
                  <Field
                    component={TextInput}
                    validate={fieldValidator([isRequired])}
                    name="description"
                    label='Add specifics to your source of funds, like "Sale of property in UK", "Family inheritance"'
                  />
                )}
                {showEmployerJobField && (
                  <Field
                    component={TextInput}
                    validate={fieldValidator([isRequired])}
                    name="currentJob"
                    label="Please insert the name of your employer and your current job title"
                  />
                )}
                {showSelfEmployedJobField && (
                  <Field
                    component={TextInput}
                    validate={fieldValidator([isRequired])}
                    name="selfEmployedActivity"
                    label="Please describe your main economic activity"
                  />
                )}
                <Field
                  component={Select}
                  validate={fieldValidator([isRequired])}
                  name="expectedAnnualTradingVolume"
                  label="How much do you intend to trade on Sight annually?"
                  options={[
                    { label: "0 to 15.000 EUR", value: "1_0_15000" },
                    { label: "15.001 to 50.000 EUR", value: "2_15001_50000" },
                    { label: "More than 50.000 EUR", value: "3_50001" }
                  ]}
                />

                {submitError && <p>{submitError}</p>}
                <Button
                  className={cx("field", "material-button", "big")}
                  classes={{ label: cx("material-button-label") }}
                  variant="contained"
                  color="primary"
                  size="large"
                  type="submit"
                >
                  Proceed
                </Button>
              </form>
            );
          }}
        />
      </div>
    </>
  );
};

SourceOfWealth.propTypes = {
  email: PropTypes.string.isRequired,
  account: PropTypes.string.isRequired,
  handleAdvanceStep: PropTypes.func.isRequired
};

export default SourceOfWealth;
