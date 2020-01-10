import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import CategoricalMarketTable from "./CategoricalMarketTable";
import ScalarMarketTable from "./ScalarMarketTable";

class MarketTable extends PureComponent {
  shouldComponentUpdate(prev, next) {
    if (prev !== next) {
      return true;
    }
    return false;
  }
  
  render() {
    const { markets } = this.props;
    if (markets && markets.length > 0) {
      if (markets[0].type === "CATEGORICAL") {
        return <CategoricalMarketTable {...this.props} />;
      } else if (markets[0].type === "SCALAR") {
        return <ScalarMarketTable {...this.props} />;
      } else {
        throw Error("Unknown market type");
      }
    }

    // TODO return a prettier error if no markets returned
    return null;
  }
}

MarketTable.propTypes = {
  markets: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.oneOf(["CATEGORICAL", "SCALAR"])
    })
  )
};

MarketTable.whyDidYouRender = true;

export default MarketTable;
