import React from "react";

import cn from "classnames/bind";
import style from "./positions.scss";

const cx = cn.bind(style);

const Positions = () => {
  return (
    <>
      <div className={cx("positions-heading")}>Your Positions</div>
      <div className={cx("positions-empty")}>You have no positions.</div>
    </>
  );
};

export default Positions;
