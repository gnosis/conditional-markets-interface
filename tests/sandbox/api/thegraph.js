import { getTrades } from "../../../app/src/api/thegraph";

getTrades().then(result => {
  console.log("Market Makers: ", result);
});
