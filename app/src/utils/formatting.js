import React from "react";
import Decimal from "decimal.js-light";

import {
  probabilityDecimalPlaces,
  collateralSignificantDigits,
  quantitySiginificantDigits
} from "./constants";

const smellsLikeDecimal = val => {
  return val.constructor === Decimal;
};

export const formatProbability = probability =>
  `${probability
    .mul(100)
    .toDecimalPlaces(probabilityDecimalPlaces, Decimal.ROUND_HALF_UP)}%`;

export const formatCollateral = (amount, collateral) => {
  const amountDecimal = smellsLikeDecimal(amount)
    ? amount
    : new Decimal((amount || "0").toString());

  const minValue = new Decimal(10).pow(-collateralSignificantDigits);

  if (amountDecimal.lt(minValue)) {
    return `<${minValue.toString()}`;
  }

  const collateralValue = amountDecimal
    .mul(collateral.fromUnitsMultiplier)
    .toSignificantDigits(collateralSignificantDigits)
    .toString();
  return `${collateralValue} ${collateral.symbol}`;
};

export const formatAmount = amount => {
  const amountDecimal = smellsLikeDecimal(amount)
    ? amount
    : new Decimal((amount || "0").toString());

  const minValue = new Decimal(10).pow(-quantitySiginificantDigits);

  if (amountDecimal.lt(minValue)) {
    return `<${minValue.toString()}`;
  }

  return amount.toSignificantDigits(quantitySiginificantDigits).toString();
};

const REPLACEMENT_RULES = [[/_(.*)_/g, "<em>$1</em>"]];

export const pseudoMarkdown = string => {
  let parsedString = REPLACEMENT_RULES.reduce(
    (prevString, [matcher, replacer]) => string.replace(matcher, replacer),
    string
  );

  return <span dangerouslySetInnerHTML={{ __html: parsedString }} />;
};
