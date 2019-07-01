import Web3 from "web3";

import Decimal from "decimal.js-light";

console.log("web3:", Web3);

const { toBN } = Web3.utils;

export const maxUint256BN = toBN(`0x${"ff".repeat(32)}`);

export const zeroDecimal = new Decimal(0);
export const oneDecimal = new Decimal(1);

export const probabilityDecimalPlaces = 2;
export const minDisplayedProbability = new Decimal(10)
  .pow(-probabilityDecimalPlaces)
  .mul("0.01");
export const collateralSignificantDigits = 5;
