import React, { useState, useCallback } from "react";
import cn from "classnames/bind";

import style from "./sidebar.scss";
import Buy from "./Buy";
import Sell from "../components/Sell";
import Resolved from "../components/Resolved";

import Spinner from "components/Spinner";

import { getMarketProbabilities } from "utils/probabilities";

const TabComponents = {
  Buy,
  Sell,
  Resolved
};

const cx = cn.bind(style);

const Sidebar = props => {
  const {
    markets,
    lmsrState,
    positions,
    marketSelections,
    setMarketSelections,
    resetMarketSelections,
    tradeHistory
  } = props;
  const [selectedTab, setSelectedTab] = useState("Buy");
  const makeButtonSelectCallback = useCallback(
    tab => {
      setSelectedTab(tab);
    },
    [selectedTab]
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

  const isInResolvedMode = markets.every(({ status }) => status === "RESOLVED");

  if (!marketProbabilities) {
    return <Spinner />;
  }

  const SelectedComponent = TabComponents[selectedTab];
  const selectedComponentsProps = {
    ...props,
    market: markets[0],
    marketSelection: marketSelections[0],
    probabilities: marketProbabilities && marketProbabilities[0],
    resetMarketSelections,
    makeButtonSelectCallback,
    tradeHistory,
  };

  return (
    <div className={cx("sidebar")}>
      <ul className={cx("tabs")}>
        {!isInResolvedMode && (
          <>
            <li className={cx({ active: selectedTab === "Buy" })}>
              <button
                type="button"
                className={cx("tab-select")}
                onClick={() => makeButtonSelectCallback("Buy")}
              >
                Buy
              </button>
            </li>
            <li className={cx({ active: selectedTab === "Sell" })}>
              <button
                type="button"
                className={cx("tab-select")}
                onClick={() => makeButtonSelectCallback("Sell")}
              >
                Positions
              </button>
            </li>
          </>
        )}
        {isInResolvedMode && (
          <li className={cx("active")}>
            <button type="button" className={cx("tab-select")} disabled>
              Market Resolved
            </button>
          </li>
        )}
      </ul>
      <div className={cx("sidebar-content")}>
        {isInResolvedMode ? (
          <Resolved {...selectedComponentsProps} />
        ) : (
          SelectedComponent && (
            <SelectedComponent {...selectedComponentsProps} />
          )
        )}
      </div>
    </div>
  );
};

export default Sidebar;
