// Importing this globally to fix regeneratorRuntime error with babel-preset-env
// and async/await code
import "regenerator-runtime/runtime";

// Router
import { ConnectedRouter } from "connected-react-router";

import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";

// CSS Reset
import "normalize.css/normalize.css";
// Base Style (loads fonts)
import "./scss/style.scss";
import { ThemeProvider } from "@material-ui/core/styles";
import theme from "scss/muiTheme";

import Decimal from "decimal.js-light";

// Routes
import Routes from "./Routes";

// Apollo
import { client } from "api/thegraph";
import { ApolloProvider } from "@apollo/react-hooks";

import { history, store } from "./store";
import GlobalStore from "store/globalStore";

// Material UI Datepicking
import MomentUtils from "@date-io/moment";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";

Decimal.config({
  precision: 80,
  toExpPos: 50,
  rounding: Decimal.ROUND_FLOOR
});

const RouterWrappedApp = (
  <ApolloProvider client={client}>
    <ThemeProvider theme={theme}>
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <GlobalStore>
            <MuiPickersUtilsProvider utils={MomentUtils}>
              <Routes />
            </MuiPickersUtilsProvider>
          </GlobalStore>
        </ConnectedRouter>
      </Provider>
    </ThemeProvider>
  </ApolloProvider>
);

const rootElement = document.getElementById("root");
render(RouterWrappedApp, rootElement);
