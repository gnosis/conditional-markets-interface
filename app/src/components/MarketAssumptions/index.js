import React from 'react'

import MarketAssumption from '../MarketAssumption'

const MarketAssumptions = ({ markets, assumptions, onSelectAssumption }) => (
  <div>
    {markets.map((market, index) => 
      <MarketAssumption
        key={market.conditionId}
        index={index}
        {...market}
        onSelectAssumption={onSelectAssumption}
        assumption={assumptions[market.conditionId]}
      />
    )}
  </div>
)

MarketAssumptions.defaultProps = {
  assumptions: {}
}

export default MarketAssumptions