import React from "react";
import PropTypes from "prop-types";

const PercentageFormat = ({ classNamePositive, classNameNegative, value }) => {
  const sign = value > 0 ? "+" : "";
  const valueFormatted = `${sign}${parseFloat(value.toFixed(2))}`;
  return (
    <span className={value > 0 ? classNamePositive : classNameNegative}>
      {valueFormatted}%
    </span>
  );
};

PercentageFormat.propTypes = {
  value: PropTypes.number.isRequired,
  classNamePositive: PropTypes.string.isRequired,
  classNameNegative: PropTypes.string.isRequired
};

export default PercentageFormat;
