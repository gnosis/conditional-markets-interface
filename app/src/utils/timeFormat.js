import moment from "moment";
export function updateLocale(lang, stringObject) {
  moment.updateLocale(lang, stringObject);
}

export function fromNow(date) {
  return moment(date).fromNow(true);
}

export function from(fromDate, toDate) {
  return moment(toDate).from(fromDate);
}

export function getMoment(date) {
  return date ? moment(date) : moment();
}

updateLocale("en", {
  relativeTime: {
    past: "CLOSED",
    s: "few seconds",
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

// Round relative time evaluation down
moment.relativeTimeRounding(Math.ceil);

moment.relativeTimeThreshold("s", 60);
moment.relativeTimeThreshold("m", 60);
moment.relativeTimeThreshold("h", 24);
moment.relativeTimeThreshold("d", 31);
moment.relativeTimeThreshold("M", 12);