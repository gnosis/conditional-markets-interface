import React from "react";

import Market from "../Market";

const Markets = ({
  markets,
  assumptions,
  selectedOutcomes,
  selectOutcomes
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
      />
    ))}
  </div>
);

export default Markets;
