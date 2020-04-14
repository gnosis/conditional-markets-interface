import React from "react";
import cn from "classnames/bind"

import style from "./transactions.scss";
import TitleBar from "../components/upperBar"

const cx = cn.bind(style)

const Approve = ({ closeModal }) => {
  return (
    <div className={cx("tx-modal")}>
      <TitleBar title="Setup Account" closeModal={closeModal} />
    </div>
  )
}

export default Approve