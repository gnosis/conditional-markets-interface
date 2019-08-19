import React from "react";
import cn from "classnames/bind";

import style from "./helpButton.scss";

const cx = cn.bind(style);

const HelpButton = () => <button className={cx("help-button")}>?</button>;

export default HelpButton;
