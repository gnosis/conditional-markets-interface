import React, { useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import Button from "@material-ui/core/Button";

import { Form, Field } from "react-final-form";
import { FORM_ERROR } from "final-form";

import { postTier2Upgrade } from "api/onboarding";

import Captcha from "components/Form/Captcha";

import { isRequired, validator } from "../../utils/validations";

import cn from "classnames/bind";
import style from "./myAccount.scss";

const cx = cn.bind(style);

const VALIDATIONS = {
  recaptchaToken: [isRequired]
};

const Tier2Request = props => {
  const { address, openModal } = props;

  const onSubmit = useCallback(
    async values => {
      const personalDetails = {
        ethAddress: address,
        ...values
      };

      const [response, json] = await postTier2Upgrade(personalDetails);

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

      openModal("KYC", {
        initialStep: "TIER2_REQUEST_SUCCESS",
        fromAccountDetails: "true",
        stepProps: props,
        address
      });
    },
    [address, openModal, props]
  );

  return (
    <>
      <p>
        Upgrade to Tier 2 and trade up to $15.000 by completing our expanded KYC
        process.
      </p>

      <Form
        onSubmit={onSubmit}
        validate={validator(VALIDATIONS)}
        render={({ handleSubmit, submitError, submitting }) => (
          <form onSubmit={handleSubmit}>
            <Field
              className={cx("field")}
              name="recaptchaToken"
              component={Captcha}
            />
            {submitError && <p className={cx("error")}>{submitError}</p>}
            <Button
              className={cx("field", "upgrade-button")}
              classes={{ label: cx("upgrade-button-label") }}
              disabled={submitting}
              variant="contained"
              color="primary"
              size="large"
              type="submit"
            >
              {submitting ? "Please wait" : "Upgrade to Tier 2"}
            </Button>
          </form>
        )}
      />
    </>
  );
};

Tier2Request.propTypes = {
  openModal: PropTypes.func.isRequired,
  address: PropTypes.string
};

export default Tier2Request;
