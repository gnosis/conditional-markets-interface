import React from "react";
import PropTypes from "prop-types";
import Media from "react-media";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";

import cn from "classnames/bind";
import style from "./sidebar.scss";

import Balance from "./Balance";
import BuySection from "./Buy";
import PositionsSections from "./Positions";

const cx = cn.bind(style);

const Sidebar = props => {
  return (
    <Media query={{ maxWidth: 850 }}>
      {matches =>
        matches ? <SidebarMobile {...props} /> : <SidebarDesktop {...props} />
      }
    </Media>
  );
};

const SidebarDesktop = props => {
  return (
    <div className={cx("sidebar")}>
      <Balance {...props} />
      <BuySection {...props} />
      <PositionsSections {...props} />
    </div>
  );
};

const SidebarMobile = props => {
  const { openModal } = props;

  return (
    <div className={cx("sidebar")}>
      <ButtonGroup fullWidth>
        <Button
          className={cx("order-button")}
          onClick={() =>
            openModal("SidebarMobile", { ...props, positionsTab: 0 })
          }
        >
          Order positions
        </Button>
        <Button
          className={cx("your-positions-button")}
          onClick={() =>
            openModal("SidebarMobile", { ...props, positionsTab: 1 })
          }
        >
          Your positions
        </Button>
      </ButtonGroup>
    </div>
  );
};

SidebarMobile.propTypes = {
  openModal: PropTypes.func.isRequired
};

export default Sidebar;
