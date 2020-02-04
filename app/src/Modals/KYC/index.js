import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Spinner from "components/Spinner";
import cn from "classnames/bind";

import style from "./kyc.scss";

const cx = cn.bind(style);

export const STEP_NATIONALITY = 0;
export const STEP_PERSONAL = 1;
export const STEP_REJECTED = 2;
export const STEP_ACCEPTED = 3;

// Child components loaded lazily on KYC load
const STEP_COMPONENTS = [
  () => import("./steps/Nationality"),
  () => import("./steps/Personal"),
  () => import("./steps/Rejected"),
  () => import("./steps/Accepted")
];

const KYC = ({ closeModal }) => {
  const [stepComponents, setStepComponents] = useState(null);
  const [loading, setLoading] = useState("LOADING");

  const [person, setPerson] = useState({});
  const [currentStepIndex, setCurrentStepIndex] = useState(STEP_NATIONALITY);

  const handleAdvanceStep = useCallback(nextStep => {
    setCurrentStepIndex(nextStep);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading("LOADING");
      const loadedComponentFiles = await Promise.all(
        STEP_COMPONENTS.map(loader => loader())
      );
      setStepComponents(
        loadedComponentFiles.map(({ default: Component }) => Component)
      );
      setLoading("SUCCESS");
    })();
  }, ["hot"]);

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
      />
    </div>
  );
};

KYC.propTypes = {
  closeModal: PropTypes.func.isRequired
};

export default KYC;
