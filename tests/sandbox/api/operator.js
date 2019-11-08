import { getMarketMakers, getQuestions } from "../../../app/src/api/operator";

getMarketMakers().then(result => {
  console.log("Market Makers: ", result);
});

getQuestions(undefined, "0x337219B4511863d51b9eAB637a41345c0E092b95").then(
  result => {
    console.log("Questions: ", result);
  }
);
