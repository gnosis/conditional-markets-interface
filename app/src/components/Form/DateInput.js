import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker-cssmodules.css";

import { TextField } from "@material-ui/core";

import style from "./DateInput.scss";

const cx = cn.bind(style);

/*
type="text"
selected={input.value}
{...props}
placeholder=" "
className={cn(cx("input"), className)}
{...input}
*/

const CustomDatePicker = props => {
  const { input, ...rest } = props;
  return (
    <DatePicker
      selected={input.value}
      className={cx("datefield")}
      {...input}
      {...rest}
    />
  );
};
CustomDatePicker.propTypes = {
  input: PropTypes.shape({
    onChange: PropTypes.func,
    value: PropTypes.any
  }).isRequired
};

const DateInput = ({
  input,
  meta: { touched, error },
  label,
  variant,
  ...props
}) => {
  console.log(touched, error);
  return (
    <TextField
      className={cx("field")}
      {...input}
      error={touched && error}
      helperText={touched && error}
      label={label}
      InputProps={{ inputComponent: CustomDatePicker }}
      variant={variant}
      {...props}
    />
  );
};

DateInput.propTypes = {
  input: PropTypes.shape({
    onChange: PropTypes.func
  }).isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  meta: PropTypes.shape({
    touched: PropTypes.bool,
    error: PropTypes.string
  }).isRequired,
  variant: PropTypes.string,
  className: PropTypes.string
};

DateInput.defaultProps = {
  className: null,
  variant: "outlined"
};

export default DateInput;
