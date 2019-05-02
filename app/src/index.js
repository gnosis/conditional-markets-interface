import React from "react";

import "normalize.css/normalize.css";
import "./style.scss";

import RootComponent from "./components/root";

/* global document */
import("react-dom").then(({ render }) => {
  const rootElement = document.getElementById("root");
  render(<RootComponent />, rootElement);
});
