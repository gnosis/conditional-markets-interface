import React from "react";
import cn from "classnames/bind";

import style from "./transactions.scss";
import TitleBar from "../components/upperBar";
import Account from "./Account";

const cx = cn.bind(style);

const Approve = ({ closeModal, title }) => {
  return (
    <div className={cx("tx-modal")}>
      <TitleBar title={title} closeModal={closeModal} />
      <div className={cx("tx-subheader")}>
        <Account />
        <div className={cx("tx-description")}>
          Setup your account to allow for a smooth transaction experience. Each
          action will trigger a transaction in your client which you&apos;ll
          have to confirm. This only has to be done once.
        </div>
      </div>
      <div className={cx("tx-content")}></div>
    </div>
  );
};

Approve.defaultProps = {
  title: "Setup Account"
};

export default Approve;
