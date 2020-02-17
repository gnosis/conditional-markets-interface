const globalStateReducer = (state, action) => {
  switch (action.type) {
    case "SET_ACCOUNT":
      return {
        ...state,
        account: action.payload
      };
    case "SET_MARKETS":
      return {
        ...state,
        markets: action.payload
      };
    case "SET_POSITIONS":
      return {
        ...state,
        positions: action.payload
      };
    case "SET_LMSR_STATE":
      return {
        ...state,
        lmsrState: action.payload
      };
    case "SET_PROBABILITIES":
      return {
        ...state,
        marketProbabilities: action.payload
      };
  }
};

export default globalStateReducer;
