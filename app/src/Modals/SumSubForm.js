import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import Logo from "assets/img/emote_trade_limit.svg";
// import Button from "@material-ui/core/Button";
import Link from "@material-ui/core/Link";

import UpperBar from "./components/upperBar";
import Header from "./components/header";

import cn from "classnames/bind";

import style from "./Modals.scss";

const cx = cn.bind(style);

const SumSubForm = props => {
  const { closeModal } = props;

  const routerLocation = useLocation();
  const [isLoading, setLoading] = useState(true);

  const initSumsub = useCallback((clientId, accessToken, externalUserId) => {
    var id = idensic.init(
      // selector of the WebSDK container (see above)
      "#sumsub-container",
      // configuration object (see settings in the demo)
      {
        // provide your clientId (can be seen in the demo)
        clientId,
        // access token for specific externalUserId
        accessToken,
        // may be some additional parameters, see the Demo to see which ones, e.g.
        externalUserId
      },
      // function for the WebSDK callbacks
      function(messageType, payload) {
        // e.g. just logging the incoming messages
        console.log("[SUMSUB DEMO] Sumsub message:", messageType, payload);
      }
    );
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(routerLocation.search);
    const clientId = searchParams.get("clientId");
    const accessToken = searchParams.get("accessToken");
    const externalUserId = searchParams.get("email");
    setLoading(false);

    // Add SumSub SDK Script
    const script = document.createElement("script");

    script.src = "https://test-api.sumsub.com/idensic/static/sumsub-kyc.js";
    script.async = true;
    script.onload = () => initSumsub(clientId, accessToken, externalUserId);

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className={cx(["modal", "over-limit-modal"])}>
      <UpperBar closeModal={closeModal} title="Create Account"></UpperBar>
      <Header title={"KYC Information"} logo={Logo}></Header>
      <div className={cx("modal-body")}>
        <div id="sumsub-container"></div>
        <Link
          className={cx("cancel-button")}
          component="button"
          onClick={closeModal}
          underline="always"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
};

SumSubForm.propTypes = {
  closeModal: PropTypes.func.isRequired,
  tier: PropTypes.number.isRequired
};

export default SumSubForm;
