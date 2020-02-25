import React from "react";
import ReCAPTCHA from "react-google-recaptcha";
import cn from "classnames/bind";

import style from "./Captcha.scss";

const cx = cn.bind(style);

const Captcha = ({ input, meta: { error, touched } }) => {
  return (
    <div className={cx("field")}>
      <ReCAPTCHA sitekey="6LfxudYUAAAAAFI3novHO8FinC9mMSIrxcyV-nbg" onChange={input.onChange} />
      {touched && error && <span className={cx("error")}>{error}</span>}
    </div>
  );
};

export default Captcha;
