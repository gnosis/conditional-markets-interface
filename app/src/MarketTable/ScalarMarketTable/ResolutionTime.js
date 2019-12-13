import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import useInterval from "@use-it/interval";

import moment from "moment";

moment.updateLocale("en", {
  relativeTime: {
    s: "ENDED",
    ss: "Ends in <%d seconds",
    m: "Ends in <1 minute",
    mm: "Ends in <%d minutes",
    h: "Ends in <1 hour",
    hh: "Ends in <%d hours",
    d: "Ends in <1 day",
    dd: "Ends in <%d days",
    M: "Ends in <1 month",
    MM: "Ends in <%d months",
    y: "Ends in <1 year",
    yy: "Ends in <%d years"
  }
});

const ResolutionDate = ({ date }) => {
  // use for testing many different random dates
  //const [date, setDate] = useState(Date.now())
  const [timeUntil, setTimeUntil] = useState("");

  const updateCountdown = useCallback(() => {
    // use for testing many different random dates
    //setDate(Date.now() + (Math.random() * 100000000))
    setTimeUntil(moment(date).fromNow(true));
  });

  useEffect(updateCountdown, []);
  useInterval(updateCountdown, 1000);

  return <span>{timeUntil}</span>;
};

ResolutionDate.propTypes = {
  date: PropTypes.string.isRequired
};

export default ResolutionDate;
