import React, { useEffect } from "react";
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

import BuySection from "./Buy";
import PositionsAndSell from "../components/Sell";
import Resolved from "../components/Resolved";

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
  const [open, setOpen] = React.useState(false);
  const [tabIndex, setTabIndex] = React.useState(0);

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

function TabPanel(props) {
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
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired
};

function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`
  };
}

const SidebarContent = props => {
  const isInResolvedMode = props.markets.every(
    ({ status }) => status === "RESOLVED"
  );

  const { tabIndex } = props;
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  useEffect(() => {
    // Handle which tab is open in mobile view
    if (tabIndex !== undefined) {
      setValue(tabIndex);
    }
  }, [tabIndex]);

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
        {isInResolvedMode ? (
          <Tab
            classes={{
              wrapper: cx("tab-title")
            }}
            label="Market is resolved"
            {...a11yProps(0)}
          ></Tab>
        ) : (
          <>
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
          </>
        )}
      </Tabs>
      {isInResolvedMode ? (
        <TabPanel value={value} index={0}>
          <Resolved {...props} />
        </TabPanel>
      ) : (
        <>
          <TabPanel value={value} index={0}>
            <BuySection {...props} />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <PositionsAndSell {...props} />
          </TabPanel>
        </>
      )}
    </div>
  );
};

SidebarContent.propTypes = {
  tabIndex: PropTypes.number
};

export default Sidebar;
