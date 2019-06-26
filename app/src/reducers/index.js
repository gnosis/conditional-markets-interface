// import { routerReducer } from "react-router-redux";
import { combineReducers } from "redux";
import exampleReducer from "./example";

export default combineReducers({
  example: exampleReducer
});
