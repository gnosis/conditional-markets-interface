import React from "react";

// import "normalize.css/normalize.css";
// import "./style/index.scss";

import RootComponent from "./components/Root";

/* global document */
import("react-dom").then(({ render }) => {
  const rootElement = document.getElementById("root");
  render(<RootComponent />, rootElement);
});
