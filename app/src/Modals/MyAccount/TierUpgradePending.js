import React from "react";

import LoadingLogo from "assets/icons/loading-static.svg";

import cn from "classnames/bind";
import style from "./myAccount.scss";

const cx = cn.bind(style);

const TierUpgradePending = ({ tier }) => {
  return (
    <div className={cx("warning-block")}>
      <img src={LoadingLogo} alt="Warning!" />
      <div className={cx("modal-body-attention")}>
        {tier < 1 && <strong>Tier 2 upgrade currently pending.</strong>}
        {tier >= 1 && (
          <strong>Tier {tier + 1} upgrade currently pending.</strong>
        )}
      </div>
    </div>
  );
};

export default TierUpgradePending;
