import React from "react";
import ReactSelect from "react-select";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import style from "./Select.scss";

const cx = cn.bind(style);
const customStyles = {
  control: styles => ({
    ...styles,
    borderColor: "inherit",
    padding: "5.44px 14px" // mimiking material-ui sizes
  })
};

const Select = ({
  options,
  className,
  input,
  meta: { touched, error },
  ...props
}) => {
  return (
    <div className={cn(cx("field"), className)}>
      <ReactSelect
        className={cx("select", { "has-error": touched && error })}
        options={options}
        styles={customStyles}
        {...input}
        {...props}
      />
      {touched && error && <span className={cx("error")}>{error}</span>}
    </div>
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
  meta: PropTypes.shape({
    touched: PropTypes.bool,
    error: PropTypes.string
  }).isRequired,
  className: PropTypes.string
};

Select.defaultProps = {
  className: null
};

export default Select;
