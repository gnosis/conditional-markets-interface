import React from "react";
import cn from "classnames/bind";

import style from "./helpButton.scss";

const cx = cn.bind(style);

const HelpButton = ({ openModal }) => (
  <button
    className={cx("help-button")}
    type="button"
    onClick={() => openModal("ConditionalExplanation")}
  >
    ?
  </button>
);

export default HelpButton;
