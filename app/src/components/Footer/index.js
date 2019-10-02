import React from "react";
import cn from "classnames/bind";

import style from "./footer.scss";

const cx = cn.bind(style);

const Footer = () => {
  return (
    <div className={cx("footer")}>
      <span>&copy; 2019 Gnosis Ops Limited</span>
      <ul className={cx("footer-links")}>
        <li>
          <a
            target="_BLANK"
            rel="noreferrer noopener"
            href="https://sight.pm/privacy.html"
          >
            Privacy Policy
          </a>
        </li>
        <li>
          <a
            target="_BLANK"
            rel="noreferrer noopener"
            href="https://sight.pm/cookies.html"
          >
            Cookies
          </a>
        </li>
        <li>
          <a
            target="_BLANK"
            rel="noreferrer noopener"
            href="https://sight.pm/imprint.html"
          >
            Imprint
          </a>
        </li>
      </ul>
    </div>
  );
};

export default Footer;
