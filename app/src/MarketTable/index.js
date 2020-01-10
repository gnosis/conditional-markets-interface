import React from "react";
import PropTypes from "prop-types";
import CategoricalMarketTable from "./CategoricalMarketTable";
import ScalarMarketTable from "./ScalarMarketTable";

const MarketTable = props => {
  const { markets } = props;
  if (markets && markets.length > 0) {
    if (markets[0].type === "CATEGORICAL") {
      return <CategoricalMarketTable {...props} />;
    } else if (markets[0].type === "SCALAR") {
      return <ScalarMarketTable {...props} />;
    } else {
      throw Error("Unknown market type");
    }
  }

  // TODO return a prettier error if no markets returned
  return null;
};

MarketTable.propTypes = {
  markets: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.oneOf(["CATEGORICAL", "SCALAR"])
    })
  )
};

export default MarketTable;
