import React from "react";
import PropTypes from "prop-types";

import cn from "classnames/bind";

import style from "./Toasts.scss";

const cx = cn.bind(style);

const Toasts = ({ toasts, deleteToast }) => (
  <div className={cx("toasts")}>
    {toasts.map(({ id, message, type }) => (
      <div className={cx("toast", `toast-type-${type}`)} key={id}>
        <i className={cx("icon", type)} />
        <span className={cx("message")}>{message}</span>
        <button type="button" className={cx("close-button")}>
          <i className={cx("icon", "close")} onClick={() => deleteToast(id)} />
        </button>
      </div>
    ))}
  </div>
);

Toasts.propTypes = {
  toasts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      message: PropTypes.node.isRequired,
      type: PropTypes.oneOf(["error", "success", "info", "default", "warning"])
    })
  ).isRequired,
  deleteToast: PropTypes.func.isRequired
};

export default Toasts;
