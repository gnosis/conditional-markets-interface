import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Media from "react-media";

import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";

import Drawer from "@material-ui/core/Drawer";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";

import cn from "classnames/bind";
import style from "./sidebar.scss";

import Tabs from "components/Tabs";
import PositionsAndSell from "./components/Sell";
import Resolved from "./components/Resolved";
import CategoricalBuy from "./components/CategoricalBuy";
import ScalarBuy from "./components/ScalarBuy";

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
  return <SidebarContent {...props} />;
};

const SidebarMobile = props => {
  const [open, setOpen] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  const handleDrawerOpen = tab => {
    setOpen(true);
    setTabIndex(tab);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const isInResolvedMode = props.markets.every(
    ({ status }) => status === "RESOLVED"
  );

  return (
    <div className={cx("sidebar")}>
      <ButtonGroup fullWidth className={cx("ButtonGroup")}>
        {isInResolvedMode ? (
          <Button
            className={cx("resolved-button")}
            onClick={() => handleDrawerOpen(0)}
          >
            Market is resolved
          </Button>
        ) : (
          <>
            <Button
              className={cx("order-button")}
              onClick={() => handleDrawerOpen(0)}
            >
              Order Positions
            </Button>
            <Button
              className={cx("your-positions-button")}
              onClick={() => handleDrawerOpen(1)}
            >
              Your Positions
            </Button>
          </>
        )}
      </ButtonGroup>

      <Drawer
        variant="persistent"
        anchor="bottom"
        open={open}
        classes={{
          paper: cx("drawer-paper")
        }}
      >
        <div className={cx("drawer-header")}>
          <IconButton onClick={handleDrawerClose}>
            <CloseIcon />
          </IconButton>
        </div>

        <SidebarContent
          {...props}
          tabIndex={tabIndex}
          setTabIndex={setTabIndex}
        />
      </Drawer>
    </div>
  );
};

SidebarMobile.propTypes = {
  openModal: PropTypes.func.isRequired
};

const ResolvedMarketSidebar = props => {
  return (
    <div className={cx("sidebar")}>
      <Tabs tabTitles={["Market is resolved"]}>
        <div className={cx("tab-content")}>
          <Resolved {...props} />
        </div>
      </Tabs>
    </div>
  );
};

ResolvedMarketSidebar.propTypes = {
  value: PropTypes.number.isRequired,
  handleChange: PropTypes.func.isRequired
};

const SidebarContent = props => {
  const { markets, marketSelections, tabIndex, setTabIndex } = props;
  if (markets && markets.length > 0 && marketSelections) {
    let BuyComponent;
    if (markets[0].type === "CATEGORICAL") {
      BuyComponent = CategoricalBuy;
    } else if (markets[0].type === "SCALAR") {
      BuyComponent = ScalarBuy;
    } else {
      throw Error("Unknown market type");
    }

    const isInResolvedMode = markets.every(
      ({ status }) => status === "RESOLVED"
    );

    const [value, setValue] = useState(0);

    useEffect(() => {
      // Handle which tab is open in mobile view
      if (tabIndex !== undefined) {
        setValue(tabIndex);
      }
    }, [tabIndex]);

    const selectTabCallback = useCallback(
      tab => {
        setValue(tab);
        if (setTabIndex) {
          setTabIndex(tab);
        }
      },
      [value]
    );

    const selectedComponentsProps = {
      ...props,
      market: markets[0],
      marketSelection: marketSelections[0],
      selectTabCallback
    };

    if (isInResolvedMode) {
      return <ResolvedMarketSidebar {...props} />;
    }

    return (
      <div className={cx("sidebar")}>
        <Tabs
          tabTitles={["Buy", "Positions"]}
          parentValue={value}
          parentSetValue={selectTabCallback}
        >
          <div className={cx("tab-content")}>
            <BuyComponent {...selectedComponentsProps} />
          </div>
          <div className={cx("tab-content")}>
            <PositionsAndSell {...props} />
          </div>
        </Tabs>
      </div>
    );
  }

  // TODO return a prettier error if no markets returned
  return null;
};

SidebarContent.propTypes = {
  markets: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired
    }).isRequired
  ).isRequired,
  tabIndex: PropTypes.number,
  setTabIndex: PropTypes.func
};

export default Sidebar;
