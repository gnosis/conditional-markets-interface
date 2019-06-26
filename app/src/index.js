import React, { render } from "react-dom";
import App from "./containers/App";

const RootComponent = () => (
  <div>
    <App />
  </div>
);

const rootElement = document.getElementById("root");
render(<RootComponent />, rootElement);
