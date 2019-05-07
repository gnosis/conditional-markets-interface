import React from "react";
import Decimal from "decimal.js-light";

export const formatProbability = probability =>
  `${probability.mul(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)}%`;

export const formatCollateral = (amount, collateral) => {
  return `${new Decimal((amount || "0").toString())
    .mul(new Decimal(10).pow(-collateral.decimals))
    .toSignificantDigits(5)
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
