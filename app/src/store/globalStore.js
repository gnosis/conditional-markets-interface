import React, { createContext, useReducer } from "react";
import globalStateReducer from "./globalStateReducer";

const initialState = {
  user: null,
  markets: null,
  positions: null,
  lmsrState: null,
  marketProbabilities: null,
  collateral: null,
  tiers: null,
  error: null
};

const globalStore = ({ children }) => {
  const [state, dispatch] = useReducer(globalStateReducer, initialState);
  return (
    <Context.Provider value={[state, dispatch]}>{children}</Context.Provider>
  );
};

export const Context = createContext(initialState);
export default globalStore;
