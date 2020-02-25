import React from "react";
import ReactSelect from "react-select";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import style from "./Select.scss";

const cx = cn.bind(style);
const customStyles = {
  control: (styles, { error }) => ({
    ...styles,
    borderColor: "red"
  })
};

const Select = ({ options, className, input, meta: { touched, error } }) => {
  return (
    <div className={cn(cx("field"), className)}>
      <ReactSelect
        className={cx("select")}
        options={options}
        //styles={customStyles}
        {...input}
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
    onChange: PropTypes.func
  }).isRequired,
  className: PropTypes.string
};

Select.defaultProps = {
  className: null
};

export default Select;
