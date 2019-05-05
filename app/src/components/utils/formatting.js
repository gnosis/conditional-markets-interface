import React from "react";
import Web3 from "web3";
import Decimal from "decimal.js-light";

export const formatProbability = probability => `${probability.mul(100)}%`;

export const formatCollateral = (amount, collateral) => {
  return (
    <>
      {collateral.decimals === 18
        ? Web3.utils.fromWei(amount || "0")
        : new Decimal(amount.toString())
            .mul(new Decimal(10).pow(-collateral.decimals))
            .toString()}{" "}
      {collateral.symbol}
    </>
  );
};

const REPLACEMENT_RULES = [[/_(.*)_/g, "<em>$1</em>"]];

export const pseudoMarkdown = string => {
  let parsedString = REPLACEMENT_RULES.reduce(
    (prevString, [matcher, replacer]) => string.replace(matcher, replacer),
    string
  );

  return <span dangerouslySetInnerHTML={{ __html: parsedString }} />;
};
