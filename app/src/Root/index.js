import React, { useState, useEffect, useCallback } from "react";
import { hot } from "react-hot-loader/root";
import cn from "classnames/bind";
import useInterval from "@use-it/interval";
import { ApolloProvider } from "@apollo/react-hooks";

import Spinner from "components/Spinner";
import CrashPage from "components/Crash";
import makeLoadable from "../utils/make-loadable";
import { loadWeb3 } from "utils/web3";
import {
  getCollectionId,
  getPositionId,
  combineCollectionIds
} from "utils/getIdsUtil";

import { getWhitelistState } from "api/whitelist";
import { getQuestions } from "api/operator";
import { client } from "api/thegraph";

import style from "./root.scss";
const cx = cn.bind(style);

import conf from "../conf";

import getMarketMakersRepo from "../repositories/MarketMakersRepo";
import getConditionalTokensRepo from "../repositories/ConditionalTokensRepo";
import getConditionalTokensService from "../services/ConditionalTokensService";
let marketMakersRepo;
let conditionalTokensRepo;
let conditionalTokensService;

const whitelistEnabled = conf.WHITELIST_ENABLED;
const SYNC_INTERVAL = 8000;
const WHITELIST_CHECK_INTERVAL = 30000;

async function loadBasicData(lmsrAddress, web3) {
  const { toBN } = web3.utils;

  let markets = await getQuestions(undefined, lmsrAddress).then(
    ({ results }) => results
  );

  markets = markets.map(market => {
    market.outcomes = market.outcomeNames.map(outcome => {
      return { title: outcome, short: outcome };
    });

    return market;
  });

  // Load application contracts
  marketMakersRepo = await getMarketMakersRepo({ lmsrAddress, web3 });
  conditionalTokensRepo = await getConditionalTokensRepo({ lmsrAddress, web3 });
  conditionalTokensService = await getConditionalTokensService({
    lmsrAddress,
    web3
  });

  const { product } = require("utils/itertools");

  const atomicOutcomeSlotCount = (
    await marketMakersRepo.atomicOutcomeSlotCount()
  ).toNumber();

  // Get collateral contract
  const collateral = await marketMakersRepo.getCollateralToken();

  let curAtomicOutcomeSlotCount = 1;
  for (let i = 0; i < markets.length; i++) {
    const market = markets[i];
    const conditionId = await marketMakersRepo.conditionIds(i);
    const numSlots = (
      await conditionalTokensRepo.getOutcomeSlotCount(conditionId)
    ).toNumber();

    if (numSlots === 0) {
      throw new Error(`condition ${conditionId} not set up yet`);
    } else if (market.type === "SCALAR") {
      if (numSlots !== 2) {
        throw new Error(
          `condition ${conditionId} outcome slot not valid for scalar market - requires long and short outcomes`
        );
      }

      // set outcomes to enable calculations on outcome count
      market.outcomes = [{ title: "short" }, { title: "long" }];
    } else if (numSlots !== market.outcomes.length) {
      throw new Error(
        `condition ${conditionId} outcome slot count ${numSlots} does not match market outcome descriptions array with length ${market.outcomes.length}`
      );
    }

    market.marketIndex = i;
    market.conditionId = conditionId;
    market.outcomes.forEach((outcome, i) => {
      outcome.collectionId = getCollectionId(conditionId, toBN(1).shln(i));
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
      .map(({ conditionId, outcomes, marketIndex }) =>
        outcomes.map((outcome, outcomeIndex) => ({
          ...outcome,
          conditionId,
          marketIndex,
          outcomeIndex
        }))
      )
  )) {
    const combinedCollectionIds = combineCollectionIds(
      outcomes.map(({ collectionId }) => collectionId)
    );

    const positionId = getPositionId(collateral.address, combinedCollectionIds);
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
    conditionalTokensService,
    collateral,
    markets,
    positions
  };
}

async function getCollateralBalance(web3, collateral, account) {
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

async function getAccount(web3) {
  if (web3.defaultAccount == null) {
    const accounts = await web3.eth.getAccounts();
    return accounts[0] || null;
  } else return web3.defaultAccount;
}

async function getLMSRState(web3, positions) {
  const { fromWei } = web3.utils;
  const [owner, funding, stage, fee, marketMakerAddress] = await Promise.all([
    marketMakersRepo.owner(),
    marketMakersRepo.funding(),
    marketMakersRepo
      .stage()
      .then(stage => ["Running", "Paused", "Closed"][stage.toNumber()]),
    marketMakersRepo.fee().then(fee => fromWei(fee)),
    marketMakersRepo.getAddress()
  ]);
  const positionBalances = await getPositionBalances(
    positions,
    marketMakerAddress
  );
  return { owner, funding, stage, fee, positionBalances, marketMakerAddress };
}

async function getPositionBalances(positions, account) {
  return Promise.all(
    positions.map(position =>
      conditionalTokensRepo.balanceOf(account, position.id)
    )
  );
}

async function getMarketResolutionStates(markets) {
  return Promise.all(
    markets.map(async ({ conditionId, outcomes }) => {
      const payoutDenominator = await conditionalTokensRepo.payoutDenominator(
        conditionId
      );
      if (payoutDenominator.gtn(0)) {
        const payoutNumerators = await Promise.all(
          outcomes.map((_, outcomeIndex) =>
            conditionalTokensRepo.payoutNumerators(conditionId, outcomeIndex)
          )
        );

        return {
          isResolved: true,
          payoutNumerators,
          payoutDenominator
        };
      } else return { isResolved: false };
    })
  );
}

async function getLMSRAllowance(collateral, account) {
  const marketMakerAddress = await marketMakersRepo.getAddress();
  return collateral.contract.allowance(account, marketMakerAddress);
}

const moduleLoadTime = Date.now();

const RootComponent = ({ match, childComponents }) => {
  const [
    MarketTable,
    Sidebar,
    Header,
    Menu,
    UserWallet,
    ApplyBetaHeader,
    Toasts,
    Footer
  ] = childComponents;

  // Init and set base state
  const [loading, setLoading] = useState("LOADING");
  const [lastError, setLastError] = useState(null);
  const [syncTime, setSyncTime] = useState(moduleLoadTime);
  const triggerSync = useCallback(() => {
    setSyncTime(Date.now());
  });
  useInterval(triggerSync, SYNC_INTERVAL);
  const [toasts, setToasts] = useState([]);

  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [collateral, setCollateral] = useState(null);
  const [markets, setMarkets] = useState(null);
  const [positions, setPositions] = useState(null);

  const lmsrAddress = match.params.lmsrAddress
    ? match.params.lmsrAddress
    : conf.lmsrAddress;

  const init = useCallback(async () => {
    const { networkId } = conf;
    try {
      console.groupCollapsed("Configuration");
      console.log(conf);
      console.groupEnd();

      const { web3, account } = await loadWeb3(networkId);

      setWeb3(web3);
      setAccount(account);

      const { collateral, markets, positions } = await loadBasicData(
        lmsrAddress,
        web3
      );

      setCollateral(collateral);
      setMarkets(markets);
      setPositions(positions);

      console.groupCollapsed("Global Debug Variables");
      console.log("LMSRMarketMaker (Instance) Contract:", marketMakersRepo);
      console.log("Collateral Settings:", collateral);
      console.log("Market Settings:", markets);
      console.log("Account Positions:", positions);
      console.groupEnd();

      setLoading("SUCCESS");
    } catch (err) {
      setLoading("FAILURE");
      // eslint-disable-next-line
      console.error(err);
      setLastError(err.message);
      throw err;
    }
  }, [lmsrAddress]);

  // First time init
  useEffect(() => {
    if (loading !== "LOADING") {
      // we already init app once. We have to clear data
      setLoading("LOADING");
      setCollateral(null);
      setMarkets(null);
      setPositions(null);
    }
    init();
  }, [lmsrAddress]);

  const [lmsrState, setLMSRState] = useState(null);
  const [marketResolutionStates, setMarketResolutionStates] = useState(null);
  const [collateralBalance, setCollateralBalance] = useState(null);
  const [positionBalances, setPositionBalances] = useState(null);
  const [lmsrAllowance, setLMSRAllowance] = useState(null);

  const [modal, setModal] = useState(null);

  // Add effect when 'syncTime' is updated this functions are triggered
  // As 'syncTime' is setted to 8 seconds all this getters are triggered and setted
  // in the state.
  for (const [loader, dependentParams, setter] of [
    [getAccount, [web3], setAccount],
    [getLMSRState, [web3, positions], setLMSRState],
    [getMarketResolutionStates, [markets], setMarketResolutionStates],
    [getCollateralBalance, [web3, collateral, account], setCollateralBalance],
    [getPositionBalances, [positions, account], setPositionBalances],
    [getLMSRAllowance, [collateral, account], setLMSRAllowance]
  ])
    useEffect(() => {
      if (dependentParams.every(p => p != null))
        loader(...dependentParams)
          .then(setter)
          .catch(err => {
            throw err;
          });
    }, [...dependentParams, syncTime]);

  const [marketSelections, setMarketSelections] = useState(null);
  const [stagedTradeAmounts, setStagedTradeAmounts] = useState(null);
  const [stagedTransactionType, setStagedTransactionType] = useState(null);

  const [ongoingTransactionType, setOngoingTransactionType] = useState(null);

  const resetMarketSelections = useCallback(() => {
    if (markets != null) {
      setMarketSelections(
        Array.from({ length: markets.length }, () => ({
          selectedOutcomeIndex: -1, // no selection
          isAssumed: false
        }))
      );
    }
  }, [markets, setMarketSelections]);

  const [whitelistState, setWhitelistState] = useState("LOADING");
  const [whitelistIntervalTime, setWhitelistCheckIntervalTime] = useState(
    WHITELIST_CHECK_INTERVAL
  );

  const updateWhitelist = useCallback(() => {
    if (account) {
      (async () => {
        const whitelistStatus = await getWhitelistState(account);
        setWhitelistState(whitelistStatus);

        if (
          whitelistStatus === "WHITELISTED" ||
          whitelistStatus === "BLOCKED"
        ) {
          setWhitelistCheckIntervalTime(null); // stops the refresh
        }
      })();
    } else {
      setWhitelistState("NOT_FOUND");
    }
  }, [account]);
  useInterval(updateWhitelist, whitelistIntervalTime);

  useEffect(() => {
    updateWhitelist();
  }, [account]);

  const asWrappedTransaction = useCallback(
    (wrappedTransactionType, transactionFn) => {
      return async function wrappedAction() {
        if (ongoingTransactionType != null) {
          throw new Error(
            `Attempted to ${wrappedTransactionType} while transaction to ${ongoingTransactionType} is ongoing`
          );
        }

        if (whitelistEnabled && whitelistState !== "WHITELISTED") {
          openModal("applyBeta", { whitelistState });
        } else {
          try {
            addToast("Transaction processing...", "info");
            setOngoingTransactionType(wrappedTransactionType);
            await transactionFn();
            addToast("Transaction confirmed.", "success");
          } catch (e) {
            addToast(
              <>
                Unfortunately, the transaction failed.
                <br />
              </>,
              "error"
            );
            throw e;
          } finally {
            setOngoingTransactionType(null);
            setStagedTransactionType(null);
            triggerSync();
          }
        }
      };
    },
    [
      whitelistEnabled,
      whitelistState,
      setOngoingTransactionType,
      ongoingTransactionType
    ]
  );

  const addToast = useCallback(
    (toastMessage, toastType = "default") => {
      const toastId = Math.round(Math.random() * 1e9 + 1e10).toString();
      const creationTime = new Date().getTime() / 1000;

      setToasts(prevToasts => [
        ...prevToasts,
        {
          id: toastId,
          message: toastMessage,
          type: toastType,
          created: creationTime,
          duration: 30 //s
        }
      ]);
    },
    [toasts]
  );

  const updateToasts = useCallback(() => {
    const now = new Date().getTime() / 1000;

    setToasts(prevToasts => {
      let newToasts = [];
      for (let toast of prevToasts) {
        if (now - toast.created < toast.duration) {
          newToasts.push(toast);
        }
      }
      return newToasts;
    });
  }, [toasts]);

  const deleteToast = useCallback(
    targetId => {
      setToasts(prevToasts => {
        const targetIndex = prevToasts.findIndex(({ id }) => id === targetId);
        prevToasts.splice(targetIndex, 1);
        return prevToasts;
      });
      updateToasts();
    },
    [setToasts, toasts]
  );

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  const openModal = useCallback(async (modalName, options) => {
    try {
      const { default: ComponentClass } = await import(`Modals/${modalName}`);
      setModal(
        <ComponentClass closeModal={closeModal} reinit={init} {...options} />
      );
    } catch (err) {
      // eslint-disable-next-line
      console.error(err.message);
      setLoading("ERROR");
    }
  }, []);

  useInterval(updateToasts, 1000);

  if (loading === "SUCCESS")
    return (
      <ApolloProvider client={client}>
        <div className={cx("page")}>
          <div className={cx("modal-space", { "modal-open": !!modal })}>
            {modal}
          </div>
          <div className={cx("app-space", { "modal-open": !!modal })}>
            <ApplyBetaHeader
              openModal={openModal}
              whitelistState={whitelistState}
            />
            <Header
              avatar={
                <UserWallet
                  address={account}
                  openModal={openModal}
                  whitelistState={whitelistState}
                  collateral={collateral}
                  collateralBalance={collateralBalance}
                />
              }
              menu={<Menu />}
            />
            <div className={cx("sections")}>
              <section className={cx("section", "section-markets")}>
                <MarketTable
                  {...{
                    markets,
                    marketResolutionStates,
                    positions,
                    lmsrState,
                    // FIXME `useQuery` hook can't be used after checking if lmsrState exists.
                    // Remove and use address from state if we divide this component in smaller ones
                    lmsrAddress,
                    marketSelections,
                    setMarketSelections,
                    stagedTradeAmounts,
                    resetMarketSelections,
                    collateral,
                    addToast,
                    openModal
                  }}
                />
              </section>
              {account != null && ( // account available
                <section className={cx("section", "section-positions")}>
                  <Sidebar
                    {...{
                      account,
                      markets,
                      positions,
                      positionBalances,
                      marketResolutionStates,
                      marketSelections,
                      collateral,
                      collateralBalance,
                      lmsrState,
                      lmsrAllowance,
                      stagedTradeAmounts,
                      setStagedTradeAmounts,
                      stagedTransactionType,
                      setStagedTransactionType,
                      ongoingTransactionType,
                      asWrappedTransaction,
                      setMarketSelections,
                      resetMarketSelections,
                      addToast,
                      openModal
                    }}
                  />
                </section>
              )}
              <Toasts
                deleteToast={deleteToast}
                addToast={addToast}
                toasts={toasts}
              />
              <Footer />
            </div>
          </div>
        </div>
      </ApolloProvider>
    );

  if (loading === "LOADING") {
    return (
      <div className={cx("loading-page")}>
        <Spinner centered width={100} height={100} />
        <p>Loading...</p>
      </div>
    );
  }
  if (loading === "FAILURE") {
    return (
      <div>
        <CrashPage errorMessage={lastError} />
      </div>
    );
  }
};

const loadableComponent = props =>
  makeLoadable(RootComponent, props, [
    () => import("MarketTable"),
    () => import("Sidebar"),
    () => import("Header"),
    () => import("components/Menu"),
    () => import("components/UserWallet"),
    () => import("components/ApplyBetaHeader"),
    () => import("components/Toasts"),
    () => import("components/Footer")
  ])();

export default hot(props => loadableComponent(props));
