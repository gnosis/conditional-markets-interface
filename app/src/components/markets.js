import React from "react";
import PropTypes from "prop-types";
import Market from "./market";

// async function loadMarginalPrices(lmsrState) {
//   const { funding, positionBalances } = lmsrState;
//   const invB = new Decimal(positionBalances.length)
//     .ln()
//     .div(funding.toString());

//   return positionBalances.map(balance =>
//     invB
//       .mul(balance.toString())
//       .neg()
//       .exp()
//   );
// }

const Markets = ({ markets }) => (
  <div>
    {markets.map(market => (
      <Market
        key={market.conditionId}
        {...{
          ...market
        }}
      />
    ))}
  </div>
);

Markets.propTypes = {
  markets: PropTypes.arrayOf(
    PropTypes.shape({
      conditionId: PropTypes.string.isRequired
    }).isRequired
  ).isRequired,
  assumptions: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  selectedOutcomes: PropTypes.object.isRequired,

  predictionProbabilities: PropTypes.any.isRequired,

  handleSelectAssumption: PropTypes.any.isRequired,
  handleSelectOutcome: PropTypes.any.isRequired
};

export default Markets;
