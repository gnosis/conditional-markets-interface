import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";
import style from "./upperBar.scss";

const cx = cn.bind(style);

const header = ({ title, logo }) => {
  return (
    <div className={cx("modal-header")}>
      <img className={cx("modal-header-image")} src={logo} alt="logo" />
      {title && <p>{title}</p>}
    </div>
  );
};

header.propTypes = {
  title: PropTypes.string,
  logo: PropTypes.string
};

export default header;
