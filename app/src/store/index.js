import { routerMiddleware } from "connected-react-router";
import { createHashHistory } from "history";
import { AnyAction, applyMiddleware, compose, createStore } from "redux";

import { createRootReducer } from "./reducers";

export const history = createHashHistory();
const rootReducer = createRootReducer(history);

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
export const store = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(routerMiddleware(history)))
);
