import React from "react";
import cn from "classnames";
import Decimal from "decimal.js-light";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import * as marketDataActions from "../actions/marketData";
import Markets from "../components/markets";
import BuySection from "../components/buy-section";
import YourPositions from "../components/your-positions";
import Spinner from "../components/spinner";
import { getNetworkName, loadWeb3 } from "../utils/web3-helpers.js";
import collateralInfo from "../utils/collateral-info";

import TruffleContract from "truffle-contract";
import { product } from "../utils/itertools";
const ERC20DetailedArtifact = require("../build/contracts/ERC20Detailed.json");
const IDSTokenArtifact = require("../build/contracts/IDSToken.json");
const WETH9Artifact = require("../build/contracts/WETH9.json");
const PredictionMarketSystemArtifact = require("../build/contracts/PredictionMarketSystem.json");
const LMSRMarketMakerArtifact = require("../build/contracts/LMSRMarketMaker.json");
const  config = require("../config.json");
import '../style.scss';

async function loadBasicData({ lmsrAddress, markets }, web3Inner, DecimalInner) {
  const { soliditySha3 } = web3.utils;

  const ERC20Detailed = TruffleContract(ERC20DetailedArtifact);
  const IDSToken = TruffleContract(IDSTokenArtifact);
  const WETH9 = TruffleContract(WETH9Artifact);
  const PredictionMarketSystem = TruffleContract(
    PredictionMarketSystemArtifact
  );
  const LMSRMarketMakerTruffle = TruffleContract(LMSRMarketMakerArtifact);
  for (const Contract of [
    ERC20Detailed,
    IDSToken,
    WETH9,
    PredictionMarketSystem,
    LMSRMarketMakerTruffle
  ]) {
    Contract.setProvider(web3.currentProvider);
  }

  const LMSRMarketMaker = await LMSRMarketMakerTruffle.at(lmsrAddress);

  const collateral = await collateralInfo(
    web3,
    DecimalInner,
    { ERC20Detailed, IDSToken, WETH9 },
    LMSRMarketMaker
  );

  const PMSystem = await PredictionMarketSystem.at(
    await LMSRMarketMaker.pmSystem()
  );
  const atomicOutcomeSlotCount = (await LMSRMarketMaker.atomicOutcomeSlotCount()).toNumber();

  let curAtomicOutcomeSlotCount = 1;
  for (let i = 0; i < markets.length; i++) {
    const market = markets[i];
    const conditionId = await LMSRMarketMaker.conditionIds(i);
    const numSlots = (await PMSystem.getOutcomeSlotCount(
      conditionId
    )).toNumber();

    if (numSlots === 0) {
      throw new Error(`condition ${conditionId} not set up yet`);
    }
    if (numSlots !== market.outcomes.length) {
      throw new Error(
        `condition ${conditionId} outcome slot count ${numSlots} does not match market outcome descriptions array with length ${market.outcomes.length}`
      );
    }

    market.marketIndex = i;
    market.conditionId = conditionId;
    market.outcomes.forEach((outcome, counter) => {
      outcome.collectionId = soliditySha3(
        { t: "bytes32", v: conditionId },
        // tslint:disable-next-line:no-bitwise
        { t: "uint", v: 1 << counter }
      );
    });

    curAtomicOutcomeSlotCount *= numSlots;
  }

  if (curAtomicOutcomeSlotCount !== atomicOutcomeSlotCount) {
    throw new Error(
      `mismatch in counted atomic outcome slot ${curAtomicOutcomeSlotCount} and contract reported value ${atomicOutcomeSlotCount}`
    );
  }

  const positions = [];
  for (const outcomes of product(
    ...markets
      .slice()
      .reverse()
      .map(({ conditionId, outcomesInner, marketIndex }) =>
        outcomesInner.map((outcome, outcomeIndex) => ({
          ...outcome,
          conditionId,
          marketIndex,
          outcomeIndex
        }))
      )
  )) {
    const positionId = soliditySha3(
      { t: "address", v: collateral.address },
      {
        t: "uint",
        v: outcomes
          .map(({ collectionId }) => collectionId)
          .map(id => web3.utils.toBN(id))
          .reduce((a, b) => a.add(b))
          .maskn(256)
      }
    );
    positions.push({
      id: positionId,
      outcomes
    });
  }

  positions.forEach((position, i) => {
    position.positionIndex = i;
  });

  for (const market of markets) {
    for (const outcome of market.outcomes) {
      outcome.positions = [];
    }
  }
  for (const position of positions) {
    for (const outcome of position.outcomes) {
      markets[outcome.marketIndex].outcomes[
        outcome.outcomeIndex
      ].positions.push(position);
    }
  }

  return {
    PMSystem,
    LMSRMarketMaker,
    collateral,
    markets,
    positions
  };
}

async function getCollateralBalance(web3Inner, collateral, account) {
  const collateralBalance = {};
  collateralBalance.amount = await collateral.contract.balanceOf(account);
  if (collateral.isWETH) {
    collateralBalance.unwrappedAmount = web3.utils.toBN(
      await web3.eth.getBalance(account)
    );
    collateralBalance.totalAmount = collateralBalance.amount.add(
      collateralBalance.unwrappedAmount
    );
  } else {
    collateralBalance.totalAmount = collateralBalance.amount;
  }

  return collateralBalance;
}

async function getLMSRState(web3Inner, PMSystem, LMSRMarketMaker, positions) {
  const { fromWei } = web3.utils;
  const [owner, funding, stage, fee, positionBalances] = await Promise.all([
    LMSRMarketMaker.owner(),
    LMSRMarketMaker.funding(),
    LMSRMarketMaker.stage().then(
      stageInner => ["Running", "Paused", "Closed"][stageInner.toNumber()]
    ),
    LMSRMarketMaker.fee().then(feeInner => fromWei(feeInner)),
    getPositionBalances(PMSystem, positions, LMSRMarketMaker.address)
  ]);
  return { owner, funding, stage, fee, positionBalances };
}

async function getMarketResolutionStates(PMSystem, markets) {
  return await Promise.all(
    markets.map(async ({ conditionId, outcomes }) => {
      const payoutDenominator = await PMSystem.payoutDenominator(conditionId);
      if (payoutDenominator.gtn(0)) {
        const payoutNumerators = await Promise.all(
          outcomes.map((_, outcomeIndex) =>
            PMSystem.payoutNumerators(conditionId, outcomeIndex)
          )
        );

        return {
          isResolved: true,
          payoutNumerators,
          payoutDenominator
        };
      } else {
        return { isResolved: false };
      }
    })
  );
}

async function getPositionBalances(PMSystem, positions, account) {
  return await Promise.all(
    positions.map(position => PMSystem.balanceOf(account, position.id))
  );
}

async function getLMSRAllowance(collateral, LMSRMarketMaker, account) {
  return await collateral.contract.allowance(account, LMSRMarketMaker.address);
}

Decimal.config({
  precision: 80,
  rounding: Decimal.ROUND_FLOOR
});

const moduleLoadTime = Date.now();

class App extends React.Component {
  async componentDidMount() {
    const { setSyncTime /* , syncTime */ } = this.props;

    // Set current syncTime
    setSyncTime(moduleLoadTime);

    // Save current time
    const currentTime = Date.now();

    // Repeatedly set the syncTime going forward
    setInterval(() => {
      setSyncTime(currentTime);
    }, 2000);

    // Make initial setup calls
    await this.setInitialDataFromWeb3Calls();

    this.initialStateSetupCalls();
    // window.requestAnimationFrame(() => {
    // this.makeUpdatesWhenPropsChange({syncTime: currentTime});
    // });
  }

  async componentDidUpdate(prevProps) {
    this.makeUpdatesWhenPropsChange(prevProps);
  }

  /*
   * This function is the same as the makeUpdatesWhenPropsChange() function,
   * however it doesn't have the conditionals. It simply makes the inital
   * calls without any checks.
   */
  initialStateSetupCalls = () => {
    const {
      setLMSRState,
      setMarketResolutionStates,
      setCollateralBalance,
      setPositionBalances,
      setLMSRAllowance,
      web3Inner,
      PMSystem,
      LMSRMarketMaker,
      positions,
      markets,
      collateral,
      account
    } = this.props;

    // LMSR State
    getLMSRState(web3, PMSystem, LMSRMarketMaker, positions).then(setLMSRState);

    // Market Resolution States
    getMarketResolutionStates(PMSystem, markets).then(
      setMarketResolutionStates
    );

    // Collateral Balance
    getCollateralBalance(web3, collateral, account).then(setCollateralBalance);

    // Position Balances
    getPositionBalances(PMSystem, positions, account).then(setPositionBalances);

    // LMSR Allowance
    getLMSRAllowance(collateral, LMSRMarketMaker, account).then(
      setLMSRAllowance
    );
  };

  makeUpdatesWhenPropsChange = async prevProps => {
    const {
      loading,
      syncTime,
      setLMSRState,
      setMarketResolutionStates,
      setCollateralBalance,
      setPositionBalances,
      setLMSRAllowance,
      web3Inner,
      PMSystem,
      LMSRMarketMaker,
      positions,
      markets,
      collateral,
      account
    } = this.props;

    // We can only execute the updates if web3 has been loaded (via the setInitialDataFromWeb3Calls() function)
    if (loading !== "SUCCESS") {
      return;
    }

    // LMSR State
    if (
      web3 !== prevProps.web3 ||
      PMSystem !== prevProps.PMSystem ||
      LMSRMarketMaker !== prevProps.LMSRMarketMaker ||
      positions !== prevProps.positions ||
      syncTime !== prevProps.syncTime
    ) {
      getLMSRState(web3, PMSystem, LMSRMarketMaker, positions).then(
        setLMSRState
      );
    }

    // Market Resolution States
    if (
      PMSystem !== prevProps.PMSystem ||
      markets !== prevProps.markets ||
      syncTime !== prevProps.syncTime
    ) {
      getMarketResolutionStates(PMSystem, markets).then(
        setMarketResolutionStates
      );
    }

    // Collateral Balance
    if (
      web3 !== prevProps.web3 ||
      collateral !== prevProps.collateral ||
      account !== prevProps.account ||
      syncTime !== prevProps.syncTime
    ) {
      getCollateralBalance(web3, collateral, account).then(
        setCollateralBalance
      );
    }

    // Position Balances
    if (
      PMSystem !== prevProps.PMSystem ||
      positions !== prevProps.positions ||
      account !== prevProps.account ||
      syncTime !== prevProps.syncTime
    ) {
      getPositionBalances(PMSystem, positions, account).then(
        setPositionBalances
      );
    }

    // LMSR Allowance
    if (
      collateral !== prevProps.collateral ||
      LMSRMarketMaker !== prevProps.LMSRMarketMaker ||
      account !== prevProps.account ||
      syncTime !== prevProps.syncTime
    ) {
      getLMSRAllowance(collateral, LMSRMarketMaker, account).then(
        setLMSRAllowance
      );
    }
  };

  setInitialDataFromWeb3Calls = async () => {
    const {
      setLoading,
      setNetworkId,
      setWeb3,
      setAccount,
      setPMSystem,
      setLMSRMarketMaker,
      setCollateral,
      setMarkets,
      setPositions
    } = this.props;

    setNetworkId(config.networkId);
    const { web3Inner, account } = await loadWeb3(config.networkId);
    setWeb3(web3);
    setAccount(account);
    const {
      PMSystem,
      LMSRMarketMaker,
      collateral,
      markets,
      positions
    } = await loadBasicData(config, web3, Decimal);
    setPMSystem(PMSystem);
    setLMSRMarketMaker(LMSRMarketMaker);
    setCollateral(collateral);
    setMarkets(markets);
    setPositions(positions);

    setLoading("SUCCESS");
    return;
  };

  asWrappedTransaction = (wrappedTransactionType, transactionFn, setError) => {
    return async () => {
      const { ongoingTransactionType, setOngoingTransactionType } = this.props;

      if (ongoingTransactionType !== null) {
        throw new Error(
          `Attempted to ${wrappedTransactionType} while transaction to ${ongoingTransactionType} is ongoing`
        );
      }

      try {
        setOngoingTransactionType(wrappedTransactionType);
        await transactionFn();
      } catch (e) {
        setError(e);
        throw e;
      } finally {
        setOngoingTransactionType(null);
        // triggerSync();
      }
    };
  };

  render() {
    const { loading, account, networkId } = this.props;

    if (loading === "SUCCESS") {
      return (
        <div className={cn("page")}>
          <h1 className={cn("page-title")}>Flyingcarpet PM</h1>
          <section className={cn("section", "market-section")}>
            <Markets />
          </section>
          <div className={cn("separator")} />
          <section className={cn("section", "position-section")}>
            {account == null ? (
              <p>
                <h2 className={cn("heading")}>Note</h2>
                <p>
                  Please connect an Ethereum provider to{" "}
                  {getNetworkName(networkId)} to interact with this market.
                </p>
              </p>
            ) : (
              <p>
                <h2 className={cn("heading")}>Manage Positions</h2>
                <BuySection asWrappedTransaction={this.asWrappedTransaction} />
                <YourPositions
                  asWrappedTransaction={this.asWrappedTransaction}
                />
              </p>
            )}
          </section>
        </div>
      );
    }

    if (loading === "LOADING") {
      return (
        <div className={cn("loading-page")}>
          <Spinner centered inverted width={100} height={100} />
        </div>
      );
    }

    if (loading === "FAILURE") {
      return (
        <div className={cn("failure-page")}>
          <h2>
            Failed to load{" "}
            <span role="img" aria-label="">
              😞
            </span>
          </h2>
          <h3>Please check the following:</h3>
          <ul>
            <li>Connect to correct network ({getNetworkName(networkId)})</li>
            <li>Install/Unlock Metamask</li>
          </ul>
        </div>
      );
    }
  }
}

App.propTypes = {
  setSyncTime: PropTypes.func.isRequired,
  loading: PropTypes.string.isRequired,
  syncTime: PropTypes.number,
  setLMSRState: PropTypes.func.isRequired,
  setMarketResolutionStates: PropTypes.func.isRequired,
  setCollateralBalance: PropTypes.func.isRequired,
  setPositionBalances: PropTypes.func.isRequired,
  setLMSRAllowance: PropTypes.func.isRequired,
  web3: PropTypes.object,
  PMSystem: PropTypes.object,
  LMSRMarketMaker: PropTypes.object,
  positions: PropTypes.array,
  markets: PropTypes.array,
  collateral: PropTypes.object,
  account: PropTypes.string,
  setLoading: PropTypes.func.isRequired,
  setNetworkId: PropTypes.func.isRequired,
  setWeb3: PropTypes.func.isRequired,
  setAccount: PropTypes.func.isRequired,
  setPMSystem: PropTypes.func.isRequired,
  setLMSRMarketMaker: PropTypes.func.isRequired,
  setCollateral: PropTypes.func.isRequired,
  setMarkets: PropTypes.func.isRequired,
  setPositions: PropTypes.func.isRequired,
  ongoingTransactionType: PropTypes.object,
  setOngoingTransactionType: PropTypes.func.isRequired,
  networkId: PropTypes.number
};

export default connect(
  state => ({
    syncTime: state.marketData.syncTime,
    loading: state.marketData.loading,
    networkId: state.marketData.networkId,
    web3: state.marketData.web3,
    account: state.marketData.account,
    PMSystem: state.marketData.PMSystem,
    LMSRMarketMaker: state.marketData.LMSRMarketMaker,
    collateral: state.marketData.collateral,
    markets: state.marketData.markets,
    positions: state.marketData.positions,
    LMSRState: state.marketData.LMSRState,
    marketResolutionStates: state.marketData.marketResolutionStates,
    collateralBalance: state.marketData.collateralBalance,
    positionBalances: state.marketData.positionBalances,
    LMSRAllowance: state.marketData.LMSRAllowance,
    marketSelections: state.marketData.marketSelections,
    stagedTradeAmounts: state.marketData.stagedTradeAmounts,
    stagedTransactionType: state.marketData.stagedTransactionType,
    ongoingTransactionType: state.marketData.ongoingTransactionType
  }),
  dispatch => ({
    setSyncTime: bindActionCreators(marketDataActions.setSyncTime, dispatch),
    setLoading: bindActionCreators(marketDataActions.setLoading, dispatch),
    setNetworkId: bindActionCreators(marketDataActions.setNetworkId, dispatch),
    setWeb3: bindActionCreators(marketDataActions.setWeb3, dispatch),
    setAccount: bindActionCreators(marketDataActions.setAccount, dispatch),
    setPMSystem: bindActionCreators(marketDataActions.setPMSystem, dispatch),
    setLMSRMarketMaker: bindActionCreators(
      marketDataActions.setLMSRMarketMaker,
      dispatch
    ),
    setCollateral: bindActionCreators(
      marketDataActions.setCollateral,
      dispatch
    ),
    setMarkets: bindActionCreators(marketDataActions.setMarkets, dispatch),
    setPositions: bindActionCreators(marketDataActions.setPositions, dispatch),
    setLMSRState: bindActionCreators(marketDataActions.setLMSRState, dispatch),
    setMarketResolutionStates: bindActionCreators(
      marketDataActions.setMarketResolutionStates,
      dispatch
    ),
    setCollateralBalance: bindActionCreators(
      marketDataActions.setCollateralBalance,
      dispatch
    ),
    setPositionBalances: bindActionCreators(
      marketDataActions.setPositionBalances,
      dispatch
    ),
    setLMSRAllowance: bindActionCreators(
      marketDataActions.setLMSRAllowance,
      dispatch
    ),
    setMarketSelections: bindActionCreators(
      marketDataActions.setMarketSelections,
      dispatch
    ),
    setStagedTradeAmounts: bindActionCreators(
      marketDataActions.setStagedTradeAmounts,
      dispatch
    ),
    setStagedTransactionType: bindActionCreators(
      marketDataActions.setStagedTransactionType,
      dispatch
    ),
    setOngoingTransactionType: bindActionCreators(
      marketDataActions.setOngoingTransactionType,
      dispatch
    )
  })
)(App);
