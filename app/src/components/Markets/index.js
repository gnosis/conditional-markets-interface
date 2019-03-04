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
  predictionProbabilities,
}) => (
  <div>
    {markets.map((market, index) => (
      <Market
        key={market.conditionId}
        {...market}
        marketIndex={index}
        assumed={assumptions.indexOf(market.conditionId) > -1}
        handleSelectOutcome={handleSelectOutcome}
        selectedOutcome={selectedOutcomes[market.conditionId]}
        disabled={!!assumptions[market.conditionId]}
        handleSelectSell={handleSelectSell}
        sellAmounts={sellAmounts}
        handleSellOutcome={handleSellOutcome}
        handleSelectAssumption={handleSelectAssumption}
        handleBuyOutcomes={handleBuyOutcomes}
        predictionProbabilities={predictionProbabilities}
      />
    ))}
  </div>
);

export default Markets;
