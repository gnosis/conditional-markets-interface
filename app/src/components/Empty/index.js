import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import style from "./empty.scss";

const cx = cn.bind(style);

const Empty = ({ errorMessage }) => {
  return (
    <div className={cx("empty-page")}>
      <h2>Welcome to SIGHT.</h2>
      <div>
        <p>
          You arrived here because no market is selected. Please visit
          <a href="https://sight.pm/#markets" rel="noreferrer noopener">
            {" "}
            our market list{" "}
          </a>
          and select a market to continue.
        </p>
        <p>If you have any questions you can contact us on the channels below:</p>
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

Empty.propTypes = {
  errorMessage: PropTypes.string
};

export default Empty;
