import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import App from "./containers/App";
import configureStore /* , { history }*/ from "./store";

export const store = configureStore();

const RootComponent = () => (
  <Provider store={store}>
    <App />
  </Provider>
);

const rootElement = document.getElementById("root");
render(<RootComponent />, rootElement);
