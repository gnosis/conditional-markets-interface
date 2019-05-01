import { render } from "react-dom";
import React from "react";

// import "normalize.css/normalize.css";
// import "./style/index.scss";

import RootComponent from "./components/Root";

/* global document */
const rootElement = document.getElementById("root");

render(<RootComponent />, rootElement);
