import React from "react";
import useGlobalState from "hooks/useGlobalState";
import Blockies from "react-blockies";
import { formatAddress } from "utils/formatting";
import cn from "classnames/bind";

import Spinner from "components/Spinner"

import style from "./transactions.scss";

const cx = cn.bind(style);

const Account = () => {
  const { account: address } = useGlobalState();

  if (!address) {
    return <Spinner inverted />;
  }

  return (
    <div className={cx("tx-account")}>
      <div className={cx("avatar")}>
        <Blockies
          seed={address.toLowerCase()}
          size={8}
          scale={16}
          className={cx("avatar-image")}
        />
      </div>
      <div className={cx("account-info")}>
        <span className={cx("address")} title={address}>
          {formatAddress(address)}
        </span>
      </div>
    </div>
  );
};

export default Account;
