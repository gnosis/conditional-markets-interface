import React from "react";

import Market from "../Market";

const Markets = ({
  markets,
  assumptions,
  selectedOutcomes,
  handleSelectOutcome,
  handleSelectSell,
  handleSellOutcome,
  handleSelectAssumption,
  handleBuyOutcomes,
  sellAmounts,
}) => (
  <div>
    {markets.map(market => (
      <Market
        key={market.conditionId}
        {...market}
        assumed={assumptions.indexOf(market.conditionId) > -1}
        handleSelectOutcome={handleSelectOutcome}
        selectedOutcome={selectedOutcomes[market.conditionId]}
        disabled={!!assumptions[market.conditionId]}
        handleSelectSell={handleSelectSell}
        sellAmounts={sellAmounts}
        handleSellOutcome={handleSellOutcome}
        handleSelectAssumption={handleSelectAssumption}
        handleBuyOutcomes={handleBuyOutcomes}
      />
    ))}
  </div>
);

export default Markets;
