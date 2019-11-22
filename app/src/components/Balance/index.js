import React from "react";
import PropTypes from "prop-types";

import { formatCollateral } from "utils/formatting";
import { zeroDecimal } from "utils/constants";

const Balance = ({ collateral, collateralBalance }) => {
  return (
    <>
      {formatCollateral(
        collateralBalance ? collateralBalance.totalAmount : zeroDecimal,
        collateral
      )}
    </>
  );
};

Balance.propTypes = {
  collateral: PropTypes.shape({
    fromUnitsMultiplier: PropTypes.object,
    symbol: PropTypes.string
  }).isRequired,
  collateralBalance: PropTypes.shape({
    totalAmount: PropTypes.object // DecimalJS
  }).isRequired
};

export default Balance;
