import { applyMiddleware, compose, createStore } from "redux";
import reducers from "../reducers/index";
// import createHistory from "history/createHashHistory";
import createSagaMiddleware from "redux-saga";
import rootSaga from "../sagas/index";
// import { routerMiddleware } from "react-router-redux";

// const history = createHistory();
// const routeMiddleware = routerMiddleware(history);
const sagaMiddleware = createSagaMiddleware();

const middlewares = [sagaMiddleware /* , routeMiddleware */];

export default function configureStore(initialState) {
  // Compose with Redux Devtools if injected
  const composeEnhancers =
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

  const store = createStore(
    reducers,
    initialState,
    composeEnhancers(applyMiddleware(...middlewares))
  );

  sagaMiddleware.run(rootSaga);

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept("../reducers/index", () => {
      const nextRootReducer = require("../reducers/index");
      store.replaceReducer(nextRootReducer);
    });
  }
  return store;
}

// export { history };
