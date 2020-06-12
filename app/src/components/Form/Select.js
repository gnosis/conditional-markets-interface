import React, { useCallback } from "react";
import ReactSelect from "react-select";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import style from "./Select.scss";

const cx = cn.bind(style);
const customStyles = {
  container: styles => ({
    ...styles,
    marginBottom: "0.8rem"
  }),
  control: styles => ({
    ...styles,
    borderColor: "inherit",
    padding: "5.44px 14px" // mimiking material-ui sizes
  }),
  menu: styles => ({
    ...styles,
    zIndex: 999
  })
};

const Select = ({
  options,
  input,
  label,
  meta: { touched, error },
  ...props
}) => {
  const conditionalProps = {};
  const handleSelect = useCallback(selectedOption => {
    input.onChange(selectedOption.value);
  }, []);

  if (label != null) {
    conditionalProps.placeholder = label;
  }

  return (
    <div className={cx("field")}>
      <ReactSelect
        className={cx({ "has-error": touched && error })}
        options={options}
        styles={customStyles}
        {...input}
        onChange={handleSelect}
        value={options.filter(({ value }) => value === input.value)}
        {...props}
        {...conditionalProps}
      />
      {touched && error && <p className={cx("error")}>{error}</p>}
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
  label: PropTypes.node,
  input: PropTypes.shape({
    onChange: PropTypes.func,
    value: PropTypes.any
  }).isRequired,
  meta: PropTypes.shape({
    touched: PropTypes.bool,
    error: PropTypes.string
  }).isRequired,
  className: PropTypes.string
};

Select.defaultProps = {
  className: null,
  label: null
};

export default Select;
