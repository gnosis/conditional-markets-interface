import React from "react";
import ReCAPTCHA from "react-google-recaptcha";
import cn from "classnames/bind";
import conf from "conf";

const { CAPTCHA_KEY } = conf;

import style from "./Captcha.scss";

const cx = cn.bind(style);

const Captcha = ({ input, meta: { error, touched } }) => {
  return (
    <div className={cx("field")}>
      <ReCAPTCHA sitekey={CAPTCHA_KEY} onChange={input.onChange} />
      {touched && error && <span className={cx("error")}>{error}</span>}
    </div>
  );
};

export default Captcha;
