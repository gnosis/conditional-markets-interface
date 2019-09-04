import React from "react";
import { render } from "react-dom";

// CSS Reset
import "normalize.css/normalize.css";

// Base Style (loads fonts)
import "./scss/style.scss";

import Decimal from "decimal.js-light";

import RootComponent from "./Root";

Decimal.config({
  precision: 80,
  rounding: Decimal.ROUND_FLOOR
});

const rootElement = document.getElementById("root");
render(<RootComponent />, rootElement);
