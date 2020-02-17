import { useContext } from "react";
import { Context } from "store/globalStore";

const useGlobalState = () => {
  const [state, dispatch] = useContext(Context);

  const setAccount = account => {
    dispatch({ type: "SET_ACCOUNT", payload: account });
  };

  const setMarkets = markets => {
    dispatch({ type: "SET_MARKETS", payload: markets });
  };

  const setPositions = positions => {
    dispatch({ type: "SET_POSITIONS", payload: positions });
  };

  const setLMSRState = lmsrState => {
    dispatch({ type: "SET_LMSR_STATE", payload: lmsrState });
  };

  const setMarketProbabilities = probabilities => {
    dispatch({ type: "SET_PROBABILITIES", payload: probabilities });
  };

  return {
    account: state.account,
    setAccount,
    markets: state.markets,
    setMarkets,
    positions: state.positions,
    setPositions,
    lmsrState: state.lmsrState,
    setLMSRState,
    marketProbabilities: state.marketProbabilities,
    setMarketProbabilities
  };
};

export default useGlobalState;
