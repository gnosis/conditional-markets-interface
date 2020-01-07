import React, { useState, useCallback } from "react";
import cn from "classnames/bind";

import style from "./sidebar.scss";
import Buy from "./Buy";
import Sell from "../components/Sell";

import Spinner from "components/Spinner";

import Decimal from "decimal.js-light";
import { calcSelectedMarketProbabilitiesFromPositionProbabilities } from "utils/probabilities";

const TabComponents = {
  Buy,
  Sell
};

const cx = cn.bind(style);

const Sidebar = props => {
  const {
    markets,
    lmsrState,
    positions,
    marketSelections,
    setMarketSelections,
    resetMarketSelections
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
    // funding = 1000
    // positionBalances = [100, 500]

    const invB = new Decimal(positionBalances.length)
      .ln()
      .div(funding.toString());
    // 1e-123

    const positionProbabilities = positionBalances.map(balance =>
      invB
        .mul(balance.toString())
        .neg()
        .exp()
    );
    // [ 1e-1000, 5e-1000 ]

    marketProbabilities = calcSelectedMarketProbabilitiesFromPositionProbabilities(
      markets,
      positions,
      marketSelections,
      positionProbabilities
    );
    // [ 0.4, 0.6 ]
  }

  if (!marketProbabilities) {
    return <Spinner />;
  }

  const SelectedComponent = TabComponents[selectedTab];
  return (
    <div className={cx("sidebar")}>
      <ul className={cx("tabs")}>
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
      </ul>
      <div className={cx("sidebar-content")}>
        {SelectedComponent && (
          <SelectedComponent
            {...{
              ...props,
              market: markets[0],
              marketSelection: marketSelections[0],
              probabilities: marketProbabilities && marketProbabilities[0],
              resetMarketSelections,
              makeButtonSelectCallback
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Sidebar;
