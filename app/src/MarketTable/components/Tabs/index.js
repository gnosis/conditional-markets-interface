import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";

import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";

import cn from "classnames/bind";
import style from "./tabs.scss";

const cx = cn.bind(style);

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

const MarketDetailsTabs = ({ children, tabTitles }) => {
  const [value, setValue] = useState(0);

  const handleChange = useCallback((event, newValue) => {
    setValue(newValue);
  });

  return (
    <div className={cx("")}>
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
        {tabTitles.map((title, index) => (
          <Tab
            key={index}
            classes={{
              wrapper: cx("tab-title")
            }}
            label={title}
            {...a11yProps(index)}
          ></Tab>
        ))}
      </Tabs>
      {children.map((child, index) => (
        <TabPanel key={index} value={value} index={index}>
          {child}
        </TabPanel>
      ))}
    </div>
  );
};

MarketDetailsTabs.propTypes = {
  children: PropTypes.node,
  tabTitles: PropTypes.array.isRequired
};

export default MarketDetailsTabs;
