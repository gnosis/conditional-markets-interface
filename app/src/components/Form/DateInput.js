import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker-cssmodules.css";

import style from "./DateInput.scss";

const cx = cn.bind(style);

const DateInput = ({
  className,
  input,
  meta: { touched, error },
  label,
  ...props
}) => {
  return (
    <div
      className={cx("field", {
        "has-error": touched && error,
        "anim-label": !!input.value
      })}
    >
      <div className={cx("box")}>
        <DatePicker
          type="text"
          selected={input.value}
          {...props}
          placeholder=" "
          className={cn(cx("input"), className)}
          {...input}
        />
        <label className={cx("label")}>{label}</label>
      </div>
      {touched && error && <span className={cx("error")}>{error}</span>}
    </div>
  );
};

DateInput.propTypes = {
  input: PropTypes.shape({
    onChange: PropTypes.func
  }).isRequired,
  meta: PropTypes.shape({
    onChange: PropTypes.func
  }).isRequired,
  wrapComponent: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  className: PropTypes.string
};

DateInput.defaultProps = {
  className: null
};

export default DateInput;
