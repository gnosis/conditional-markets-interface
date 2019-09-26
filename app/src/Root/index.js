import React, { useState, useEffect, useCallback } from "react";
import { hot } from "react-hot-loader/root";
import cn from "classnames/bind";
import useInterval from "@use-it/interval";

import Logo from "assets/img/conditional-logo@3x.png";
import Spinner from "components/Spinner";
import CrashPage from "components/Crash";
import loadContracts from "loadContracts";
import { loadWeb3 } from "utils/web3";

import style from "./root.scss";
const cx = cn.bind(style);

import getMarketMakersRepo from "../repositories/MarketMakersRepo";
import getConditionalTokensRepo from "../repositories/ConditionalTokensRepo";
import getConditionalTokensService from "../services/ConditionalTokensService";
let marketMakersRepo;
let conditionalTokensRepo;
let conditionalTokensService;

async function loadBasicData({ markets }, web3) {
  const { soliditySha3 } = web3.utils;

  // Load application contracts
  marketMakersRepo = await getMarketMakersRepo();
  conditionalTokensRepo = await getConditionalTokensRepo();
  conditionalTokensService = await getConditionalTokensService();
  const {
    collateralToken: collateral,
    pmSystem,
    lmsrMarketMaker
  } = await loadContracts();

  const { product } = require("utils/itertools");

  const atomicOutcomeSlotCount = (await marketMakersRepo.atomicOutcomeSlotCount()).toNumber();

  let curAtomicOutcomeSlotCount = 1;
  for (let i = 0; i < markets.length; i++) {
    const market = markets[i];
    const conditionId = await marketMakersRepo.conditionIds(i);
    const numSlots = (await conditionalTokensRepo.getOutcomeSlotCount(
      conditionId
    )).toNumber();

    if (numSlots === 0)
      throw new Error(`condition ${conditionId} not set up yet`);
    if (numSlots !== market.outcomes.length)
      throw new Error(
        `condition ${conditionId} outcome slot count ${numSlots} does not match market outcome descriptions array with length ${
          market.outcomes.length
        }`
      );

    market.marketIndex = i;
    market.conditionId = conditionId;
    const getOutcomesPromises = market.outcomes.map((outcome, i) => {
      return conditionalTokensRepo.getCollectionId(
        web3.utils.padLeft(0, 32),
        conditionId,
        i
      );
    });

    const outcomes = await Promise.all(getOutcomesPromises);
    market.outcomes.forEach((outcome, i) => {
      outcome.collectionId = outcomes[i];
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
    conditionalTokensService,
    pmSystem,
    lmsrMarketMaker,
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

async function getLMSRState(web3, lmsrMarketMaker, positions) {
  const { fromWei } = web3.utils;
  const [owner, funding, stage, fee, positionBalances] = await Promise.all([
    marketMakersRepo.owner(),
    marketMakersRepo.funding(),
    marketMakersRepo
      .stage()
      .then(stage => ["Running", "Paused", "Closed"][stage.toNumber()]),
    marketMakersRepo.fee().then(fee => fromWei(fee)),
    getPositionBalances(positions, lmsrMarketMaker.address)
  ]);
  return { owner, funding, stage, fee, positionBalances };
}

async function getPositionBalances(positions, account) {
  return await Promise.all(
    positions.map(position =>
      conditionalTokensRepo.balanceOf(account, position.id)
    )
  );
}

async function getMarketResolutionStates(markets) {
  return await Promise.all(
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

async function getLMSRAllowance(collateral, lmsrMarketMaker, account) {
  return await collateral.contract.allowance(account, lmsrMarketMaker.address);
}

const moduleLoadTime = Date.now();

const makeLoadable = (Component, childComponents) => {
  const loadableWrapped = () => {
    const [loadingState, setLoadingState] = useState("LOADING");
    const [loadedComponents, setLoadedComponents] = useState([]);

    useEffect(() => {
      (async () => {
        setLoadingState("LOADING");
        try {
          const loadedChildren = await Promise.all(
            childComponents.map(loader => loader())
          );

          setLoadedComponents(
            loadedChildren.map(
              ({ default: exportedComponent }) => exportedComponent
            )
          );
          setLoadingState("SUCCESS");
        } catch (err) {
          setLoadingState("ERROR");
        }
      })();
    }, ["hot"]);

    if (loadingState === "LOADING") {
      return (
        <div className={cx("loading-page")}>
          <Spinner centered width={100} height={100} />
        </div>
      );
    }

    if (loadingState === "ERROR") {
      return <CrashPage />;
    }

    if (loadingState === "SUCCESS") {
      return <Component childComponents={loadedComponents} />;
    }
  };

  return loadableWrapped;
};

const RootComponent = ({ childComponents }) => {
  const [
    MarketTable,
    Sidebar,
    Header,
    Menu,
    UserWallet,
    Toasts
  ] = childComponents;

  const [loading, setLoading] = useState("LOADING");
  const [lastError, setLastError] = useState(null);
  const [syncTime, setSyncTime] = useState(moduleLoadTime);
  const triggerSync = useCallback(() => {
    setSyncTime(Date.now());
  });
  useInterval(triggerSync, 8000);
  const [toasts, setToasts] = useState([]);

  //const [networkId, setNetworkId] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [conditionalTokensService, setConditionalTokensService] = useState(
    null
  );
  const [pmSystem, setPMSystem] = useState(null);
  const [lmsrMarketMaker, setLMSRMarketMaker] = useState(null);
  const [collateral, setCollateral] = useState(null);
  const [markets, setMarkets] = useState(null);
  const [positions, setPositions] = useState(null);

  const init = useCallback(() => {
    // const networkToUse = process.env.NETWORK || "local";
    import(
      /* webpackChunkName: "config" */
      /* webpackInclude: /\.json$/ */
      /* webpackMode: "lazy" */
      /* webpackPrefetch: true */
      /* webpackPreload: true */
      `../conf`
    )
      .then(async ({ default: config }) => {
        /* eslint-disable no-console */
        console.groupCollapsed("Configuration");
        console.log(config);
        console.groupEnd();

        /* eslint-enable no-console */
        //setNetworkId(config.networkId);
        const { web3, account } = await loadWeb3(config.networkId);

        setWeb3(web3);
        setAccount(account);

        const {
          conditionalTokensService,
          pmSystem,
          lmsrMarketMaker,
          collateral,
          markets,
          positions
        } = await loadBasicData(config, web3);

        setConditionalTokensService(conditionalTokensService);
        setPMSystem(pmSystem);
        setLMSRMarketMaker(lmsrMarketMaker);
        setCollateral(collateral);
        setMarkets(markets);
        setPositions(positions);

        setLoading("SUCCESS");
      })
      .catch(err => {
        setLoading("FAILURE");
        // eslint-disable-next-line
        console.error(err);
        setLastError(err.message);
        throw err;
      });
  }, []);

  useEffect(init, []);

  const [lmsrState, setLMSRState] = useState(null);
  const [marketResolutionStates, setMarketResolutionStates] = useState(null);
  const [collateralBalance, setCollateralBalance] = useState(null);
  const [positionBalances, setPositionBalances] = useState(null);
  const [lmsrAllowance, setLMSRAllowance] = useState(null);

  const [modal, setModal] = useState(null);

  // Add effect when 'syncTime' is updated this functions are triggered
  // As 'syncTime' is setted to 2 seconds all this getters are triggered and setted
  // in the state.
  for (const [loader, dependentParams, setter] of [
    [getLMSRState, [web3, lmsrMarketMaker, positions], setLMSRState],
    [getMarketResolutionStates, [markets], setMarketResolutionStates],
    [getCollateralBalance, [web3, collateral, account], setCollateralBalance],
    [getPositionBalances, [positions, account], setPositionBalances],
    [getLMSRAllowance, [collateral, lmsrMarketMaker, account], setLMSRAllowance]
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

  const asWrappedTransaction = useCallback(
    (wrappedTransactionType, transactionFn) => {
      return async function wrappedAction() {
        if (ongoingTransactionType != null) {
          throw new Error(
            `Attempted to ${wrappedTransactionType} while transaction to ${ongoingTransactionType} is ongoing`
          );
        }

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
              <strong>{e.message}</strong>
            </>,
            "error"
          );
          throw e;
        } finally {
          setOngoingTransactionType(null);
          triggerSync();
        }
      };
    },
    [setOngoingTransactionType, ongoingTransactionType]
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
      <div className={cx("page")}>
        <div className={cx("modal-space", { "modal-open": !!modal })}>
          <img className={cx("logo")} src={Logo} />
          {modal}
          {/*<ul className={cx("footer")}>
            <li>
              <a href="/static/help.html" target="_BLANK">
                Help
              </a>
            </li>
            <li>
              <a href="/static/privacy.html" target="_BLANK">
                Privacy
              </a>
            </li>
            <li>
              <a href="/static/terms.html" target="_BLANK">
                Terms
              </a>
            </li>
            </ul>*/}
        </div>
        <div className={cx("app-space", { "modal-open": !!modal })}>
          <Header
            avatar={<UserWallet address={account} openModal={openModal} />}
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
                  marketSelections,
                  setMarketSelections,
                  stagedTradeAmounts,
                  resetMarketSelections,
                  addToast,
                  openModal
                }}
              />
            </section>
            {account != null && (
              <section className={cx("section", "section-positions")}>
                <Sidebar
                  {...{
                    account,
                    conditionalTokensRepo,
                    pmSystem,
                    markets,
                    positions,
                    marketResolutionStates,
                    marketSelections,
                    collateral,
                    collateralBalance,
                    lmsrMarketMaker,
                    lmsrState,
                    lmsrAllowance,
                    positionBalances,
                    stagedTradeAmounts,
                    setStagedTradeAmounts,
                    stagedTransactionType,
                    setStagedTransactionType,
                    ongoingTransactionType,
                    asWrappedTransaction,
                    resetMarketSelections,
                    addToast
                  }}
                />
              </section>
            )}
            <Toasts
              deleteToast={deleteToast}
              addToast={addToast}
              toasts={toasts}
            />
          </div>
        </div>
      </div>
    );

  if (loading === "LOADING") {
    return (
      <div className={cx("loading-page")}>
        <Spinner centered width={100} height={100} />
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

export default hot(
  makeLoadable(RootComponent, [
    () => import("MarketTable"),
    () => import("Sidebar"),
    () => import("Header"),
    () => import("components/Menu"),
    () => import("components/UserWallet"),
    () => import("components/Toasts"),
    () => import("components/Footer")
  ])
);
