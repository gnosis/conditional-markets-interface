import React from "react";

import cn from "classnames/bind";
import style from "./sidebar.scss";

import Balance from "./Balance";
import BuySection from "./Buy";
import PositionsSections from "./Positions";

const cx = cn.bind(style);

const Sidebar = props => {
  return (
    <div className={cx("sidebar")}>
      <Balance {...props} />
      <BuySection {...props} />
      <PositionsSections {...props} />
    </div>
  );
};

export default Sidebar;
