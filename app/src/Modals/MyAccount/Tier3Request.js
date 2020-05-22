import React, { useCallback } from "react";
import PropTypes from "prop-types";
import Button from "@material-ui/core/Button";

import { Form, Field } from "react-final-form";
import { FORM_ERROR } from "final-form";

import { postTier3Upgrade } from "api/onboarding";

import Captcha from "components/Form/Captcha";

import { isRequired, validator } from "../../utils/validations";

import cn from "classnames/bind";
import style from "../Modals.scss";

const cx = cn.bind(style);

const VALIDATIONS = {
  recaptchaToken: [isRequired]
};

const Tier3Request = props => {
  const { address, openModal } = props;

  const onSubmit = useCallback(
    async values => {
      const personalDetails = {
        ethAddress: address,
        ...values
      };

      const [response, json] = await postTier3Upgrade(personalDetails);

      if (!response.ok) {
        if (response.code === 400) {
          return json;
        } else if (response.code === 403) {
          return {
            [FORM_ERROR]:
              "You can't request Tier 3 before beign enabled as Tier 2. Please wait until your application has been approved."
          };
        } else {
          return {
            [FORM_ERROR]:
              "Unfortunately, the whitelisting API returned a non-standard error. Please try again later."
          };
        }
      }

      const { fromAccountDetails, fromTradeOverLimit, ...stepProps } = props;

      openModal("KYC", {
        initialStep: "TIER3_REQUEST_SUCCESS",
        fromAccountDetails,
        fromTradeOverLimit,
        stepProps,
        address
      });
    },
    [address, openModal, props]
  );

  return (
    <>
      <p>
        Upgrade to Tier 3 and trade unlimited amounts by verifying your source
        of wealth.
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
              className={cx("field", "material-button")}
              classes={{ label: cx("material-button-label") }}
              disabled={submitting}
              variant="contained"
              color="primary"
              size="large"
              type="submit"
            >
              {submitting ? "Please wait" : "Upgrade to Tier 3"}
            </Button>
          </form>
        )}
      />
    </>
  );
};

Tier3Request.propTypes = {
  openModal: PropTypes.func.isRequired,
  address: PropTypes.string,
  fromAccountDetails: PropTypes.bool,
  fromTradeOverLimit: PropTypes.bool
};

export default Tier3Request;
