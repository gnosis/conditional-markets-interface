import React from "react";
import PropTypes from "prop-types";
// import cn from "classnames/bind";
import {
  FormControlLabel,
  Checkbox,
  FormControl,
  FormHelperText
} from "@material-ui/core";

// const cx = cn.bind("./Checkbox.scss");

const CheckboxField = ({ input, label, meta: { touched, error } }) => {
  return (
    <FormControl error={!!(touched && error)}>
      <FormControlLabel
        control={<Checkbox checked={input.value} value={""} {...input} />}
        label={label}
        helper
      />
      {touched && error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

CheckboxField.propTypes = {
  input: PropTypes.object.isRequired,
  label: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
  meta: PropTypes.shape({
    touched: PropTypes.bool,
    error: PropTypes.string
  }).isRequired
};

export default CheckboxField;
