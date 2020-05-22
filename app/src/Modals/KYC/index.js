import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Spinner from "components/Spinner";
import cn from "classnames/bind";

import style from "./kyc.scss";

const cx = cn.bind(style);

export const STEP_RESIDENCE = "RESIDENCE";
export const STEP_TIER2_REQUEST = "TIER2_REQUEST";
export const STEP_TIER2_REQUEST_SUCCESS = "TIER2_REQUEST_SUCCESS";
export const STEP_TIER3_REQUEST_SUCCESS = "TIER3_REQUEST_SUCCESS";
export const STEP_NATIONALITY = "NATIONALITY";
export const STEP_PERSONAL = "PERSONAL";
export const STEP_REJECTED = "REJECTED";
export const STEP_APPROVED = "APPROVED";
export const STEP_PENDING = "PENDING";
export const STEP_SOW = "SOW";

// Child components loaded lazily on KYC load
const STEP_COMPONENTS = {
  [STEP_RESIDENCE]: () => import("./steps/EuropeResident"),
  [STEP_TIER2_REQUEST]: () => import("./steps/Tier2Request"),
  [STEP_TIER2_REQUEST_SUCCESS]: () => import("./steps/Tier2RequestSuccess"),
  [STEP_TIER3_REQUEST_SUCCESS]: () => import("./steps/Tier3RequestSuccess"),
  [STEP_NATIONALITY]: () => import("./steps/Nationality"),
  [STEP_PERSONAL]: () => import("./steps/Personal"),
  [STEP_REJECTED]: () => import("./steps/Rejected"),
  [STEP_APPROVED]: () => import("./steps/Approved"),
  [STEP_PENDING]: () => import("./steps/Pending"),
  [STEP_SOW]: () => import("./steps/SOW")
};

const KYC = ({ closeModal, initialStep, ...props }) => {
  const [stepComponents, setStepComponents] = useState(null);
  const [loading, setLoading] = useState("LOADING");

  const [person, setPerson] = useState({});
  const [currentStepIndex, setCurrentStepIndex] = useState(STEP_RESIDENCE);
  const [currentStepProps, setCurrentStepProps] = useState(props);

  useEffect(() => {
    // on load, jump to prop step
    if (initialStep) {
      setCurrentStepIndex(initialStep);
    }
  }, []);

  const handleAdvanceStep = useCallback(nextStep => {
    if (Array.isArray(nextStep)) {
      const [step, props] = nextStep;
      setCurrentStepIndex(step);
      setCurrentStepProps(props);
    } else {
      setCurrentStepIndex(nextStep);
    }
  }, []);
  // debug
  window.advanceStep = handleAdvanceStep;

  useEffect(() => {
    (async () => {
      setLoading("LOADING");
      const loadedStepComponents = {};
      const loadedAllComponents = await Promise.all(
        Object.keys(STEP_COMPONENTS).map(async stepName => {
          loadedStepComponents[stepName] = (
            await STEP_COMPONENTS[stepName]()
          ).default;
        })
      );
      await loadedAllComponents;

      setStepComponents(loadedStepComponents);
      setLoading("SUCCESS");
    })();
  }, []);

  if (loading === "LOADING") {
    return (
      <div className={cx("modal", "kyc-modal", "loading")}>
        <Spinner centered width={100} height={100} />
      </div>
    );
  }

  const TargetComponent = stepComponents[currentStepIndex];
  return (
    <div className={cx("modal", "kyc-modal")}>
      <TargetComponent
        person={person}
        updatePerson={setPerson}
        closeModal={closeModal}
        handleAdvanceStep={handleAdvanceStep}
        {...currentStepProps}
      />
    </div>
  );
};

KYC.propTypes = {
  closeModal: PropTypes.func.isRequired,
  initialStep: PropTypes.string
};

KYC.defaultProps = {
  initialStep: null
};

export default KYC;
