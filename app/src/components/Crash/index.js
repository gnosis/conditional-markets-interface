import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import style from "./crash.scss";

const cx = cn.bind(style);

const Crash = ({ errorMessage }) => {
  return (
    <div className={cx("crash-page")}>
      <h2>Something went wrong.</h2>
      <div>
        <p>
          Unfortunately something did not go right and the application has
          crashed. Please reload the page or contact us via:
        </p>
        <br />
        <div className={cx("contact-channels")}>
          <a
            href="https://t.me/GnosisGeneral"
            target="_BLANK"
            rel="noreferrer noopener"
          >
            <i className={cx("icon", "telegram")} />
          </a>
          <a
            href="mailto:support@gnosis.io"
            target="_BLANK"
            rel="noreferrer noopener"
          >
            <i className={cx("icon", "email")} />
          </a>
          <a
            href="https://gitter.im/gnosis/Lobby"
            target="_BLANK"
            rel="noreferrer noopener"
          >
            <i className={cx("icon", "gitter")} />
          </a>
        </div>
      </div>
      {errorMessage && (
        <div className={cx("error-message")}>
          <h4>
            Error Message: <code>{errorMessage}</code>
          </h4>
        </div>
      )}
    </div>
  );
};

Crash.propTypes = {
  errorMessage: PropTypes.string
};

export default Crash;
