import * as types from "../actions/marketData-types";

const INITIAL_STATE = {
  syncTime: null,
  loading: "LOADING",
  networkId: null,
  web3: null,
  account: null,
  PMSystem: null,
  LMSRMarketMaker: null,
  collateral: null,
  markets: null,
  positions: null,
  LMSRState: null,
  marketResolutionStates: null,
  collateralBalance: null,
  positionBalances: null,
  LMSRAllowance: null,
  marketSelections: null,
  stagedTradeAmounts: null,
  stagedTransactionType: null,
  ongoingTransactionType: null
};

export default function marketData(state = INITIAL_STATE, action) {
  switch (action.type) {
    case types.SET_SYNC_TIME:
      return {
        ...state,
        syncTime: action.syncTime
      };
    case types.SET_LOADING:
      return {
        ...state,
        loading: action.loading
      };
    case types.SET_NETWORK_ID:
      return {
        ...state,
        networkId: action.networkId
      };
    case types.SET_WEB3:
      return {
        ...state,
        web3: action.web3
      };
    case types.SET_ACCOUNT:
      return {
        ...state,
        account: action.account
      };
    case types.SET_PM_SYSTEM:
      return {
        ...state,
        PMSystem: action.PMSystem
      };
    case types.SET_LMSR_MARKET_MAKER:
      return {
        ...state,
        LMSRMarketMaker: action.LMSRMarketMaker
      };
    case types.SET_COLLATERAL:
      return {
        ...state,
        collateral: action.collateral
      };
    case types.SET_MARKETS:
      return {
        ...state,
        markets: action.markets
      };
    case types.SET_POSITIONS:
      return {
        ...state,
        positions: action.positions
      };
    case types.SET_LMSR_STATE:
      return {
        ...state,
        LMSRState: action.LMSRState
      };
    case types.SET_MARKET_RESOLUTION_STATES:
      return {
        ...state,
        marketResolutionStates: action.marketResolutionStates
      };
    case types.SET_COLLATERAL_BALANCE:
      return {
        ...state,
        collateralBalance: action.collateralBalance
      };
    case types.SET_POSITION_BALANCES:
      return {
        ...state,
        positionBalances: action.positionBalances
      };
    case types.SET_LMSR_ALLOWANCE:
      return {
        ...state,
        LMSRAllowance: action.LMSRAllowance
      };
    case types.SET_MARKET_SELECTIONS:
      return {
        ...state,
        marketSelections: action.marketSelections
      };
    case types.SET_STAGED_TRADE_AMOUNTS:
      return {
        ...state,
        stagedTradeAmounts: action.stagedTradeAmounts
      };
    case types.SET_STAGED_TRANSACTION_TYPE:
      return {
        ...state,
        stagedTransactionType: action.stagedTransactionType
      };
    case types.SET_ONGOING_TRANSACTION_TYPE:
      return {
        ...state,
        ongoingTransactionType: action.ongoingTransactionType
      };
    default:
      return state;
  }
}
