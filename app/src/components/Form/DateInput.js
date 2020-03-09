import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import { DatePicker } from "@material-ui/pickers";

import style from "./DateInput.scss";

const cx = cn.bind(style);

const DateInput = ({ input, meta, label, variant, ...props }) => {
  return (
    <DatePicker
      classes={{ root: cx("field") }}
      error={meta.touched && meta.error}
      helperText={meta.touched && meta.error}
      label={label}
      inputVariant={variant}
      variant="inline"
      format="L"
      {...input}
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
