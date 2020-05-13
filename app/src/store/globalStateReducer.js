const globalStateReducer = (state, action) => {
  let userUpdate;
  switch (action.type) {
    case "SET_ACCOUNT":
      return {
        ...state,
        account: action.payload
      };
    case "SET_USER":
      if (action.payload) {
        userUpdate = { ...state.user, ...action.payload };
      } else {
        userUpdate = action.payload;
      }
      return {
        ...state,
        user: userUpdate
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
    case "SET_COLLATERAL":
      return {
        ...state,
        collateral: action.payload
      };
    case "SET_TIERS":
      return {
        ...state,
        tiers: action.payload
      };
  }
};

export default globalStateReducer;
