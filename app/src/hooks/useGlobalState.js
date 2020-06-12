import { useContext } from "react";
import { Context } from "store/globalStore";

const useGlobalState = () => {
  const [state, dispatch] = useContext(Context);

  const setAccount = account => {
    dispatch({ type: "SET_USER", payload: { account } });
  };

  const setUser = user => {
    dispatch({ type: "SET_USER", payload: user });
  };

  const setTradingVolume = tradingVolume => {
    dispatch({ type: "SET_USER", payload: { tradingVolume } });
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

  const setCollateral = collateral => {
    dispatch({ type: "SET_COLLATERAL", payload: collateral });
  };

  const setTiers = tiers => {
    dispatch({ type: "SET_TIERS", payload: tiers });
  };

  return {
    account: state.user && state.user.account,
    setAccount,
    user: state.user,
    setUser,
    setTradingVolume,
    markets: state.markets,
    setMarkets,
    positions: state.positions,
    setPositions,
    lmsrState: state.lmsrState,
    setLMSRState,
    marketProbabilities: state.marketProbabilities,
    setMarketProbabilities,
    collateral: state.collateral,
    setCollateral,
    tiers: state.tiers,
    setTiers
  };
};

export default useGlobalState;
