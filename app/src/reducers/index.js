// import { routerReducer } from "react-router-redux";
import { combineReducers } from "redux";
import marketDataReducer from "./marketData";

export default combineReducers({
  marketData: marketDataReducer
});
