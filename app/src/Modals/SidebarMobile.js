import React from "react";
import PropTypes from "prop-types";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";

import cn from "classnames/bind";

import style from "./sidebarMobile.scss";

const cx = cn.bind(style);

import Balance from "../Sidebar/Balance";
import BuySection from "../Sidebar/Buy";
import PositionsSections from "../Sidebar/Positions";

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
      <Box p={3}>{children}</Box>
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

const SidebarMobile = props => {
  const { closeModal, positionsTab } = props;
  const [value, setValue] = React.useState(positionsTab);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <div className={cx("modal", "positions-modal")}>
      <div className={cx("modal-header")}>
        <a href="#" className={cx("modal-close")} onClick={closeModal}></a>{" "}
      </div>
      <div className={cx("modal-body")}>
        <Tabs value={value} onChange={handleChange} variant="fullWidth">
          <Tab label="Order positions" {...a11yProps(0)}></Tab>
          <Tab label="Your positions" {...a11yProps(1)}></Tab>
        </Tabs>
        <TabPanel value={value} index={0}>
          <BuySection {...props} />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <PositionsSections {...props} />
        </TabPanel>
        <Balance {...props} />
      </div>
    </div>
  );
};

SidebarMobile.propTypes = {
  closeModal: PropTypes.func.isRequired,
  positionsTab: PropTypes.number.isRequired
};

export default SidebarMobile;
