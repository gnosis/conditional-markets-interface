import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";
import useInterval from "@use-it/interval";

import { fromNow, formatDate } from "utils/timeFormat";

import style from "./resolutionDate.scss";

const cx = cn.bind(style);

const ResolutionDate = ({ date }) => {
  // use for testing many different random dates
  //const [date, setDate] = useState(Date.now())
  const [timeUntil, setTimeUntil] = useState("");

  const updateCountdown = useCallback(() => {
    // use for testing many different random dates
    //setDate(Date.now() + (Math.random() * 100000000))
    setTimeUntil(fromNow(date));
  });

  useEffect(updateCountdown, []);
  useInterval(updateCountdown, 1000);

  return (
    <div className={cx("resolution-date")}>
      <strong>{timeUntil}</strong>
      <p title="Your Timezone">{formatDate(date, "L LTS")}</p>
    </div>
  );
};

ResolutionDate.propTypes = {
  date: PropTypes.string.isRequired
};

export default ResolutionDate;
