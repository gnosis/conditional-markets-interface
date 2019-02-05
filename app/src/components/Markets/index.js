import React from "react";

import Market from "../Market";

const Markets = ({
  markets,
  assumptions,
  selectedOutcomes,
  selectOutcomes,
  handleSelectSell,
  handleSellOutcome,
  sellAmounts
}) => (
  <div>
    {markets.map(market => (
      <Market
        key={market.conditionId}
        {...market}
        assumption={assumptions[market.conditionId]}
        selectOutcomes={selectOutcomes}
        selectedOutcomes={selectedOutcomes}
        disabled={!!assumptions[market.conditionId]}
        handleSelectSell={handleSelectSell}
        sellAmounts={sellAmounts}
        handleSellOutcome={handleSellOutcome}
      />
    ))}
  </div>
);

export default Markets;
