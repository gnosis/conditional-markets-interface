import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Media from "react-media";

import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";

import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";

import Drawer from "@material-ui/core/Drawer";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";

import cn from "classnames/bind";
import style from "./sidebar.scss";

import Spinner from "components/Spinner";
import PositionsAndSell from "./components/Sell";
import Resolved from "./components/Resolved";

import CategoricalBuy from "./components/CategoricalBuy";
import ScalarBuy from "./components/ScalarBuy";

import { getMarketProbabilities } from "utils/probabilities";

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

        <SidebarContent {...props} tabIndex={tabIndex} />
      </Drawer>
    </div>
  );
};

SidebarMobile.propTypes = {
  openModal: PropTypes.func.isRequired
};

const TabPanel = props => {
  const { children, value, index, ...other } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      <Box className={cx("tab-content")}>{children}</Box>
    </Typography>
  );
};

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired
};

const a11yProps = index => {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`
  };
};

const ResolvedMarketSidebar = props => {
  const { value, handleChange } = props;
  return (
    <div className={cx("sidebar")}>
      <Tabs
        value={value}
        indicatorColor="primary"
        textColor="primary"
        onChange={handleChange}
        variant="fullWidth"
        classes={{
          root: cx("tab-selector")
        }}
      >
        <Tab
          classes={{
            wrapper: cx("tab-title")
          }}
          label="Market is resolved"
          {...a11yProps(0)}
        ></Tab>
      </Tabs>
      <TabPanel value={value} index={0}>
        <Resolved {...props} />
      </TabPanel>
    </div>
  );
};

ResolvedMarketSidebar.propTypes = {
  value: PropTypes.number.isRequired,
  handleChange: PropTypes.func.isRequired
};

const SidebarContent = props => {
  const { markets, lmsrState, positions, marketSelections, tabIndex } = props;
  if (markets && markets.length > 0) {
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

    const handleChange = useCallback((event, newValue) => {
      setValue(newValue);
    });

    useEffect(() => {
      // Handle which tab is open in mobile view
      if (tabIndex !== undefined) {
        setValue(tabIndex);
      }
    }, [tabIndex]);

    const makeButtonSelectCallback = useCallback(
      tab => {
        setValue(tab);
      },
      [value]
    );

    let marketProbabilities = null;
    if (lmsrState != null) {
      const { funding, positionBalances } = lmsrState;

      const { newMarketProbabilities } = getMarketProbabilities(
        funding,
        positionBalances,
        markets,
        positions,
        marketSelections
      );

      marketProbabilities = newMarketProbabilities;
    }

    const selectedComponentsProps = {
      ...props,
      market: markets[0],
      marketSelection: marketSelections[0],
      probabilities: marketProbabilities && marketProbabilities[0],
      makeButtonSelectCallback
    };

    if (!marketProbabilities) {
      return <Spinner />;
    }

    if (isInResolvedMode) {
      return (
        <ResolvedMarketSidebar
          {...props}
          value={value}
          handleChange={handleChange}
        />
      );
    }

    return (
      <div className={cx("sidebar")}>
        <Tabs
          value={value}
          indicatorColor="primary"
          textColor="primary"
          onChange={handleChange}
          variant="fullWidth"
          classes={{
            root: cx("tab-selector")
          }}
        >
          <Tab
            classes={{
              wrapper: cx("tab-title")
            }}
            label="Buy"
            {...a11yProps(0)}
          ></Tab>
          <Tab
            classes={{
              wrapper: cx("tab-title")
            }}
            label="Positions"
            {...a11yProps(1)}
          ></Tab>
        </Tabs>
        <TabPanel value={value} index={0}>
          <BuyComponent {...selectedComponentsProps} />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <PositionsAndSell {...props} />
        </TabPanel>
      </div>
    );
  }

  // TODO return a prettier error if no markets returned
  return null;
};

SidebarContent.propTypes = {
  tabIndex: PropTypes.number
};

export default Sidebar;
