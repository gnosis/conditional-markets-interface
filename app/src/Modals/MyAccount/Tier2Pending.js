import React from "react";

import LoadingLogo from "assets/icons/loading-static.svg";

import cn from "classnames/bind";
import style from "./myAccount.scss";

const cx = cn.bind(style);

const Tier2Pending = () => {
  return (
    <div className={cx("warning-block")}>
      <img src={LoadingLogo} alt="Warning!" />
      <div className={cx("modal-body-attention")}>
        <strong>Tier 2 upgrade currently pending.</strong>
      </div>
    </div>
  );
};

export default Tier2Pending;
