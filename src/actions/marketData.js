import * as types from "./marketData-types";

export const setSyncTime = syncTime => ({
  syncTime,
  type: types.SET_SYNC_TIME
});

export const setLoading = loading => ({
  loading,
  type: types.SET_LOADING
});

export const setNetworkId = networkId => ({
  networkId,
  type: types.SET_NETWORK_ID
});

export const setWeb3 = web3 => ({
  web3,
  type: types.SET_WEB3
});

export const setAccount = account => ({
  account,
  type: types.SET_ACCOUNT
});

export const setPMSystem = PMSystem => ({
  PMSystem,
  type: types.SET_PM_SYSTEM
});

export const setLMSRMarketMaker = LMSRMarketMaker => ({
  LMSRMarketMaker,
  type: types.SET_LMSR_MARKET_MAKER
});

export const setCollateral = collateral => ({
  collateral,
  type: types.SET_COLLATERAL
});

export const setMarkets = markets => ({
  markets,
  type: types.SET_MARKETS
});

export const setPositions = positions => ({
  positions,
  type: types.SET_POSITIONS
});

export const setLMSRState = LMSRState => ({
  LMSRState,
  type: types.SET_LMSR_STATE
});

export const setMarketResolutionStates = marketResolutionStates => ({
  marketResolutionStates,
  type: types.SET_MARKET_RESOLUTION_STATES
});

export const setCollateralBalance = collateralBalance => ({
  collateralBalance,
  type: types.SET_COLLATERAL_BALANCE
});

export const setPositionBalances = positionBalances => ({
  positionBalances,
  type: types.SET_POSITION_BALANCES
});

export const setLMSRAllowance = LMSRAllowance => ({
  LMSRAllowance,
  type: types.SET_LMSR_ALLOWANCE
});

export const setMarketSelections = marketSelections => ({
  marketSelections,
  type: types.SET_MARKET_SELECTIONS
});

export const setStagedTradeAmounts = stagedTradeAmounts => ({
  stagedTradeAmounts,
  type: types.SET_STAGED_TRADE_AMOUNTS
});

export const setStagedTransactionType = stagedTransactionType => ({
  stagedTransactionType,
  type: types.SET_STAGED_TRANSACTION_TYPE
});

export const setOngoingTransactionType = ongoingTransactionType => ({
  ongoingTransactionType,
  type: types.SET_ONGOING_TRANSACTION_TYPE
});
