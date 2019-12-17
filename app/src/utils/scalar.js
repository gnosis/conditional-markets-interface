import { zeroDecimal, oneDecimal } from "./constants";
import Decimal from "decimal.js-light";

export const fromProbabilityToSlider = (market, probability) => {
  const decimalUpper = new Decimal(market.upperBound);
  const decimalLower = new Decimal(market.lowerBound);

  const value = decimalUpper
    .sub(decimalLower)
    .mul(probability)
    .add(decimalLower);

  return value.toNumber(); // lowerBound to upperBound
};
