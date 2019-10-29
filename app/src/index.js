// Router
import { ConnectedRouter } from "connected-react-router";

import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";

// CSS Reset
import "normalize.css/normalize.css";

// Base Style (loads fonts)
import "./scss/style.scss";

import Decimal from "decimal.js-light";

// Routes
import Routes from "./Routes";

import { history, store } from "./store";

Decimal.config({
  precision: 80,
  rounding: Decimal.ROUND_FLOOR
});

const RouterWrappedApp = (
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Routes />
    </ConnectedRouter>
  </Provider>
);

const rootElement = document.getElementById("root");
render(RouterWrappedApp, rootElement);
