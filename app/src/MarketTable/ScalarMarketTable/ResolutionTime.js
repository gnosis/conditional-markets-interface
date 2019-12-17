import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import useInterval from "@use-it/interval";

import { fromNow, setScalarLocale } from "utils/timeFormat";

const ResolutionDate = ({ date }) => {
  // use for testing many different random dates
  //const [date, setDate] = useState(Date.now())
  const [timeUntil, setTimeUntil] = useState("");

  const updateCountdown = useCallback(() => {
    // use for testing many different random dates
    //setDate(Date.now() + (Math.random() * 100000000))
    setScalarLocale();
    setTimeUntil(fromNow(date));
  });

  useEffect(updateCountdown, []);
  useInterval(updateCountdown, 1000);

  return <span>{timeUntil}</span>;
};

ResolutionDate.propTypes = {
  date: PropTypes.string.isRequired
};

export default ResolutionDate;
