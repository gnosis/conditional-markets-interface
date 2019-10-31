import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";
import useInterval from "@use-it/interval";

import moment from "moment";

import style from "./resolutionDate.scss";

moment.updateLocale("en", {
  relativeTime: {
    s: "CLOSED",
    ss: "<%d seconds",
    m: "<1 minute",
    mm: "<%d minutes",
    h: "<1 hour",
    hh: "<%d hours",
    d: "<1 day",
    dd: "<%d days",
    M: "<1 month",
    MM: "<%d months",
    y: "<1 year",
    yy: "<%d years"
  }
});

const cx = cn.bind(style);

const ResolutionDate = ({ date }) => {
  // use for testing many different random dates
  //const [date, setDate] = useState(Date.now())
  const [timeUntil, setTimeUntil] = useState("");

  const updateCountdown = useCallback(() => {
    // use for testing many different random dates
    //setDate(Date.now() + (Math.random() * 100000000))
    if (moment(date).isAfter(moment())) {
      setTimeUntil("CLOSED");
    } else {
      setTimeUntil(moment(date).fromNow(true));
    }
  });

  useEffect(updateCountdown, []);
  useInterval(updateCountdown, 1000);

  return (
    <div className={cx("resolution-date")}>
      <strong>{timeUntil}</strong>
      <p title="Your Timezone">{moment(date).format("L LTS")}</p>
    </div>
  );
};

ResolutionDate.propTypes = {
  date: PropTypes.string.isRequired
};

export default ResolutionDate;
