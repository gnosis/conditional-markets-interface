import React from "react";
import cn from "classnames/bind";

import style from "./menu.scss";

const cx = cn.bind(style);

const isProduction = process.env.NODE_ENV === "production";
const marketsPage = `${process.env.BASE_URL}${isProduction ? "#markets" : ""}`;

const menuItems = [
  {
    label: "MARKETS",
    target: marketsPage,
    active: true
  }
];

const Menu = () => (
  <nav className={cx("menu")}>
    <ul>
      {menuItems.map(({ label, target, active }) => (
        <li className={cx("menu-item", { active })} key={target}>
          <a href={target}>{label}</a>
        </li>
      ))}
    </ul>
  </nav>
);

Menu.propTypes = {};

export default Menu;
