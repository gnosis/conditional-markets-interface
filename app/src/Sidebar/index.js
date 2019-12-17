import React from "react";
import CategoricalSidebar from "./CategoricalSidebar";
import ScalarSidebar from "./ScalarSidebar";

const Sidebar = props => {
  const { markets } = props;
  if (markets && markets.length > 0) {
    if (markets[0].type === "CATEGORICAL") {
      return <CategoricalSidebar {...props} />;
    } else if (markets[0].type === "SCALAR") {
      return <ScalarSidebar {...props} />;
    } else {
      throw Error("Unknown market type");
    }
  }

  // TODO return a prettier error if no markets returned
  return null;
};

export default Sidebar;
