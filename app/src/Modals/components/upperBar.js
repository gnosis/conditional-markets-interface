import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";
import style from "./upperBar.scss";

const cx = cn.bind(style);

const upperBar = ({ title, closeModal }) => {
  return (
    <div className={cx("modal-upper", title && "titled")}>
      {title && <span className={cx("title")}>{title}</span>}
      <span className={cx("modal-close")} onClick={closeModal}></span>{" "}
    </div>
  );
};

upperBar.propTypes = {
  title: PropTypes.node,
  closeModal: PropTypes.func.isRequired
};

export default upperBar;
