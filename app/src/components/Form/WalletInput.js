import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import style from "./TextInput.scss";

const cx = cn.bind(style);

const WalletInput = ({ className, input, meta: { touched, error }, label, ...props }) => {
  return (
    <div className={cx("field", { "has-error": touched && error })}>
      <div className={cx("box")}>
        <input
          type="text"
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

WalletInput.propTypes = {
  input: PropTypes.shape({
    onChange: PropTypes.func
  }).isRequired,
  meta: PropTypes.shape({
    onChange: PropTypes.func
  }).isRequired,
  wrapComponent: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  className: PropTypes.string
};

WalletInput.defaultProps = {
  className: null
};

export default WalletInput;
