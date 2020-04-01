import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import { TextField } from "@material-ui/core";

import style from "./TextInput.scss";

const cx = cn.bind(style);

const TextInput = ({
  // className,
  input,
  meta: { touched, error },
  label,
  variant,
  readOnly,
  ...props
}) => {
  return (
    <TextField
      classes={{ root: cx("field") }}
      {...input}
      error={touched && error}
      helperText={touched && error}
      label={label}
      variant={variant}
      InputProps={{
        readOnly
      }}
      {...props}
    />
  );
};

TextInput.propTypes = {
  input: PropTypes.shape({
    onChange: PropTypes.func
  }).isRequired,
  meta: PropTypes.shape({
    touched: PropTypes.bool,
    error: PropTypes.string
  }).isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  variant: PropTypes.string,
  readOnly: PropTypes.bool,
  className: PropTypes.string
};

TextInput.defaultProps = {
  className: null,
  variant: "outlined",
  readOnly: false
};

export default TextInput;
