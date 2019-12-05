import React from "react";
import PropTypes from "prop-types";

import cn from "classnames/bind";
import style from "./header.scss";

import Logo from "img/conditional-logo-color.svg";

const cx = cn.bind(style);

const isProduction = process.env.NODE_ENV === "production";
const marketsPage = `${process.env.BASE_URL}${isProduction ? "#markets" : ""}`;

const Header = ({ avatar }) => (
  <div className={cx("header")}>
    <button
      className={cx("logo")}
      onClick={() => (location.href = marketsPage)}
      type="button"
    >
      <img src={Logo} alt="Gnosis Conditional Tokens" />
    </button>
    <div className={cx("avatar")}>{avatar}</div>
  </div>
);

Header.propTypes = {
  avatar: PropTypes.node.isRequired
};

export default Header;
