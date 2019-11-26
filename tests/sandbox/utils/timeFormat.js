import { from, fromNow, getMoment } from "../../../app/src/utils/timeFormat";

const now = getMoment();

let fromDate, toDate;
// With a time difference of 1 day and 1 minute should return less than 2 days
fromDate = new Date("2019-12-01T18:14:30");
toDate = new Date("2019-12-02T18:15:30");
console.log(from(fromDate, toDate));

// With a time difference of 23 hours and 59 minutes should return less than 1 day
fromDate = new Date("2019-12-01T18:14:30");
toDate = new Date("2019-12-02T18:13:30");
console.log(from(fromDate, toDate));

// With a time difference of 22 hours and 59 minutes should return less than 23 hours
fromDate = new Date("2019-12-01T18:14:30");
toDate = new Date("2019-12-02T17:13:30");
console.log(from(fromDate, toDate));

// With a time difference of 1 hour and 1 minute should return less than 2 hours
fromDate = new Date("2019-12-01T18:14:30");
toDate = new Date("2019-12-01T19:15:30");
console.log(from(fromDate, toDate));

// With a time difference of 59 minutes should return less than 59 minutes
fromDate = new Date("2019-12-01T18:14:30");
toDate = new Date("2019-12-01T19:13:30");
console.log(from(fromDate, toDate));

// With a time difference of 45 seconds should return in a few seconds
fromDate = new Date("2019-12-01T18:14:30");
toDate = new Date("2019-12-01T18:15:15");
console.log(from(fromDate, toDate));

// With a time difference of -1 minute should return CLOSED
fromDate = new Date("2019-12-01T18:14:30");
toDate = new Date("2019-12-01T18:13:30");
console.log(from(fromDate, toDate));
