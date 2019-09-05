import React from "react";
import cn from "classnames/bind";

import style from "./footer.scss";

const cx = cn.bind(style);

const Footer = () => {
  return (
    <div className={cx("footer")}>
      <p>Only for Demonstration Purposes</p>
    </div>
  );
};

export default Footer;
