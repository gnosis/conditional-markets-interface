import React, { useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";

// We want to explicitly import this styles sheet as raw css so
// we can use it as parameter for SumSub SDK init object
// First ! blocks normal css loaders. Then we cast `raw-loader`
// Second ! is to separate from file name
import style from "!raw-loader!./sumSubInjectStyle.css";

const SumSubForm = ({ email }) => {
  const routerLocation = useLocation();

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
        externalUserId,
        uiConf: {
          customCssStr: style
        }
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
    const clientId = searchParams.get("sdk_client");
    const accessToken = searchParams.get("sdk_token");

    // Add SumSub SDK Script
    const script = document.createElement("script");

    script.src = "https://test-api.sumsub.com/idensic/static/sumsub-kyc.js";
    script.async = true;
    script.onload = () => initSumsub(clientId, accessToken, email);

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div id="sumsub-container"></div>;
};

SumSubForm.propTypes = {
  email: PropTypes.string.isRequired
};

export default SumSubForm;
