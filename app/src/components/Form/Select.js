import React from "react";
import ReactSelect from "react-select";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import style from "./select.scss";

const cx = cn.bind(style);

const Select = ({ options, className, input }) => {
  return (
    <ReactSelect
      className={cn(cx("select"), className)}
      options={options}
      {...input}
    />
  );
};

Select.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.any,
      value: PropTypes.any
    })
  ).isRequired,
  input: PropTypes.shape({
    onChange: PropTypes.func
  }).isRequired,
  className: PropTypes.string,
};

Select.defaultProps = {
  className: null
};

export default Select;
