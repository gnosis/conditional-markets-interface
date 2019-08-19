import React from "react";
import Decimal from "decimal.js-light";

import {
  probabilityDecimalPlaces,
  collateralSignificantDigits
} from "./constants";

export const formatProbability = probability =>
  `${probability
    .mul(100)
    .toDecimalPlaces(probabilityDecimalPlaces, Decimal.ROUND_HALF_UP)}%`;

export const formatCollateral = (amount, collateral) => {
  return `${new Decimal((amount || "0").toString())
    .mul(collateral.fromUnitsMultiplier)
    .toSignificantDigits(collateralSignificantDigits)
    .toString()} ${collateral.symbol}`;
};

const REPLACEMENT_RULES = [[/_(.*)_/g, "<em>$1</em>"]];

export const pseudoMarkdown = string => {
  let parsedString = REPLACEMENT_RULES.reduce(
    (prevString, [matcher, replacer]) => string.replace(matcher, replacer),
    string
  );

  return <span dangerouslySetInnerHTML={{ __html: parsedString }} />;
};
