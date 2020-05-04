import React from "react";
import PropTypes from "prop-types";
import Blockies from "react-blockies";
import cn from "classnames/bind";

import Button from "@material-ui/core/Button";

import { formatAddress } from "utils/formatting";

import style from "./tier2.scss";
const cx = cn.bind(style);

// Logged In common components
const LoggedIn = ({ address, disconnect }) => {
  return (
    <div className={cx("logged-info")}>
      <div className={cx("avatar")}>
        <Blockies
          seed={address.toLowerCase()}
          size={8}
          scale={16}
          className={cx("avatar-image")}
        />
      </div>
      <span className={cx("address")} title={address}>
        {formatAddress(address)}
      </span>
      <Button
        className={cx("field", "material-button")}
        classes={{ label: cx("material-button-label") }}
        variant="contained"
        color="primary"
        size="large"
        type="submit"
        onClick={disconnect}
      >
        Disconnect
      </Button>
    </div>
  );
};

LoggedIn.propTypes = {
  address: PropTypes.string,
  disconnect: PropTypes.func.isRequired
};

export default LoggedIn;
