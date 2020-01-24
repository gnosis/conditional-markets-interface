import React from "react";
import Decimal from "decimal.js-light";

import {
  probabilityDecimalPlaces,
  collateralSignificantDigits,
  quantitySiginificantDigits,
  collateralConsiderAsZeroDigits,
  zeroDecimal
} from "./constants";

const smellsLikeDecimal = val => {
  return val && val.constructor === Decimal;
};

export const formatProbability = probability =>
  `${probability
    .mul(100)
    .toDecimalPlaces(probabilityDecimalPlaces, Decimal.ROUND_HALF_UP)}%`;

export const formatCollateral = (amount, collateral) => {
  const amountDecimal = smellsLikeDecimal(amount)
    ? amount
    : new Decimal((amount || "0").toString());

  const amountFullUnits = amountDecimal.mul(collateral.fromUnitsMultiplier);

  const minValue = new Decimal(10).pow(-collateralSignificantDigits);
  const minValueToConsiderAsZero = new Decimal(10).pow(
    -collateralConsiderAsZeroDigits
  );

  if (amountFullUnits.abs().lt(minValueToConsiderAsZero)) {
    return `0 ${collateral.symbol}`;
  }

  if (amountFullUnits.abs().lt(minValue)) {
    return `<${
      amountFullUnits.lt(zeroDecimal) ? " -" : ""
    }${minValue.toString()} ${collateral.symbol}`;
  }

  const collateralValue = amountFullUnits
    .toSignificantDigits(collateralSignificantDigits)
    .toString();
  return `${collateralValue} ${collateral.symbol}`;
};

export const formatAmount = (amount, dividend = 1) => {
  const amountDecimal = smellsLikeDecimal(amount)
    ? amount
    : new Decimal((amount.toString() || "0").toString());

  const minValue = new Decimal(10).pow(-quantitySiginificantDigits);

  if (amountDecimal.lt(minValue)) {
    return `<${minValue.toString()}`;
  }

  return amountDecimal
    .div(dividend)
    .toSignificantDigits(quantitySiginificantDigits)
    .toString();
};

export const formatScalarValue = (value, unit = "units", decimals = 0) => {
  return `${value.toFixed(Math.min(decimals, 2))} ${unit}`;
};

const REPLACEMENT_RULES = [[/_(.*)_/g, "<em>$1</em>"]];

export const pseudoMarkdown = string => {
  let parsedString = REPLACEMENT_RULES.reduce(
    (prevString, [matcher, replacer]) => string.replace(matcher, replacer),
    string
  );

  return <span dangerouslySetInnerHTML={{ __html: parsedString }} />;
};
