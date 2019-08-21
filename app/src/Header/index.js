import React from "react";
import PropTypes from "prop-types";

import cn from "classnames/bind";
import style from "./header.scss";

import Logo from "img/conditional-logo-color.svg";

const cx = cn.bind(style);

const Header = ({ avatar, menu }) => (
  <div className={cx("header")}>
    <button
      className={cx("logo")}
      onClick={() => location.reload()}
      type="button"
    >
      <img src={Logo} alt="Gnosis Conditional Tokens" />
    </button>
    <div className={cx("menu")}>{menu}</div>
    <div className={cx("avatar")}>{avatar}</div>
  </div>
);

Header.propTypes = {
  avatar: PropTypes.node.isRequired,
  menu: PropTypes.node.isRequired
};

export default Header;
