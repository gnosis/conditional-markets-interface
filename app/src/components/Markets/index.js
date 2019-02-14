import React from "react";

import Market from "../Market";

const Markets = ({
  markets,
  assumptions,
  selectedOutcomes,
  handleSelectOutcome,
  handleSelectSell,
  handleSellOutcome,
  handleSelectInvest,
  handleSelectAssumption,
  sellAmounts,
  investments
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
        handleSelectInvest={handleSelectInvest}
        handleSelectAssumption={handleSelectAssumption}
        invest={investments[market.conditionId]}
      />
    ))}
  </div>
);

export default Markets;
