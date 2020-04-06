import React, { useState, useEffect, useCallback } from "react";
import { hot } from "react-hot-loader/root";
import cn from "classnames/bind";
import useInterval from "@use-it/interval";
import { useSubscription } from "@apollo/react-hooks";

import useGlobalState from "hooks/useGlobalState";
import Spinner from "components/Spinner";
import CrashPage from "components/Crash";

import makeLoadable from "utils/make-loadable";
import { getAccount, loadWeb3 } from "utils/web3";
import { loadMarketsData } from "utils/getMarketsData";
import ToastifyError from "utils/ToastifyError";
import web3Modal from "utils/web3Modal";

import { getUserState, getTiersLimit } from "api/onboarding";
import { GET_TRADES_BY_MARKET_MAKER } from "api/thegraph";

import style from "./root.scss";
const cx = cn.bind(style);

import conf from "../conf";

import getConditionalTokensService from "../services/ConditionalTokensService";

const ONBOARDING_MODE = conf.ONBOARDING_MODE;

const SHOW_WHITELIST_HEADER = ONBOARDING_MODE === "WHITELIST";

const SYNC_INTERVAL = 8000;
const WHITELIST_CHECK_INTERVAL = 30000;

async function loadBlockchainService({
  markets,
  lmsrAddress,
  web3,
  account,
  collateralTokenAddress
}) {
  const conditionalTokensService = await getConditionalTokensService({
    lmsrAddress,
    web3,
    account,
    collateralTokenAddress
  });

  let curAtomicOutcomeSlotCount = 1;
  for (let i = 0; i < markets.length; i++) {
    const market = markets[i];
    const { outcomeSlotCount: numSlots } = market;

    curAtomicOutcomeSlotCount *= numSlots;
  }

  // Get collateral info
  const collateral = conditionalTokensService.getCollateralToken();

  const atomicOutcomeSlotCount = await conditionalTokensService.getAtomicOutcomeSlotCount();
  if (curAtomicOutcomeSlotCount !== atomicOutcomeSlotCount) {
    throw new Error(
      `mismatch in counted atomic outcome slot ${curAtomicOutcomeSlotCount} and contract reported value ${atomicOutcomeSlotCount}`
    );
  }

  return {
    collateral,
    conditionalTokensService
  };
}

const moduleLoadTime = Date.now();

const RootComponent = ({
  match,
  childComponents,
  initialModal,
  initialStep
}) => {
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

  const {
    account,
    setAccount,
    user,
    setUser,
    markets,
    setMarkets,
    positions,
    setPositions,
    lmsrState,
    setLMSRState,
    collateral,
    setCollateral,
    setTiers
  } = useGlobalState();

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
  const [conditionalTokensService, setConditionalTokensService] = useState(
    null
  );

  const lmsrAddress = match.params.lmsrAddress
    ? match.params.lmsrAddress
    : conf.lmsrAddress;

  const init = useCallback(
    async provider => {
      try {
        console.groupCollapsed("Configuration");
        console.log(conf);
        console.groupEnd();

        let web3Provider = provider;
        if (!provider && web3Modal.cachedProvider) {
          web3Provider = await web3Modal.connect();
        }

        const [
          { web3, account },
          { markets, collateralToken: collateralTokenAddress, positions }
        ] = await Promise.all([
          loadWeb3(conf.networkId, web3Provider),
          loadMarketsData({ lmsrAddress })
        ]);

        setWeb3(web3);
        setAccount(account);

        setMarkets(markets);
        setPositions(positions);

        // setLoading("SUCCESS");

        const {
          collateral,
          conditionalTokensService
        } = await loadBlockchainService({
          markets,
          collateralTokenAddress,
          lmsrAddress,
          web3,
          account
        });

        setConditionalTokensService(conditionalTokensService);
        setCollateral(collateral);

        console.groupCollapsed("Global Debug Variables");
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
    },
    [lmsrAddress, user, setUser]
  );

  // First time init
  useEffect(() => {
    if (loading !== "LOADING") {
      // we already init app once. We have to clear data
      setLoading("LOADING");
      // setCollateral(null);
      setMarkets(null);
      setUser(null);
      setConditionalTokensService(null);
      setLMSRState(null);
    }
    init();
  }, [lmsrAddress]);

  const setProvider = useCallback(
    async provider => {
      if (
        provider === null &&
        web3 &&
        web3.currentProvider &&
        web3.currentProvider.close
      ) {
        await web3.currentProvider.close();
      }
      setLoading("LOADING");
      init(provider);
    },
    [lmsrAddress, web3, init]
  );

  const [marketResolutionStates, setMarketResolutionStates] = useState(null);
  const [collateralBalance, setCollateralBalance] = useState(null);
  const [positionBalances, setPositionBalances] = useState(null);

  const [modal, setModal] = useState(null);

  const getLMSRState = useCallback(
    positions => {
      return conditionalTokensService.getLMSRState(positions);
    },
    [conditionalTokensService]
  );

  const getMarketResolutionStates = useCallback(
    markets => {
      return conditionalTokensService.getMarketResolutionStates(markets);
    },
    [conditionalTokensService]
  );

  const getCollateralBalance = useCallback(
    account => {
      return conditionalTokensService.getCollateralBalance(account);
    },
    [conditionalTokensService]
  );

  const getPositionBalances = useCallback(
    (positions, account) => {
      return conditionalTokensService.getPositionBalances(positions, account);
    },
    [conditionalTokensService]
  );

  // Open specified modal if initialModal is set
  useEffect(() => {
    if (initialModal) {
      const options = {};

      if (initialModal === "KYC" && initialStep != null) {
        options.initialStep = initialStep;
      }

      openModal(initialModal, options);
    }
  }, []);

  // Add effect when 'syncTime' is updated this functions are triggered
  // As 'syncTime' is setted to 8 seconds all this getters are triggered and setted
  // in the state.
  for (const [loader, dependentParams, setter] of [
    [getAccount, [web3], setAccount],
    [getLMSRState, [positions], setLMSRState],
    [getMarketResolutionStates, [markets], setMarketResolutionStates],
    [getCollateralBalance, [account], setCollateralBalance],
    [getPositionBalances, [positions, account], setPositionBalances]
  ])
    useEffect(() => {
      if (dependentParams.every(p => p != null) && conditionalTokensService)
        loader(...dependentParams)
          .then(setter)
          .catch(err => {
            throw err;
          });
    }, [...dependentParams, conditionalTokensService, syncTime]);

  const [marketSelections, setMarketSelections] = useState(null);
  const [stagedTradeAmounts, setStagedTradeAmounts] = useState(null);
  const [stagedTransactionType, setStagedTransactionType] = useState(null);

  const [ongoingTransactionType, setOngoingTransactionType] = useState(null);

  const resetMarketSelections = useCallback(() => {
    if (markets !== null) {
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
        const userState = await getUserState(account);
        const { status: whitelistStatus } = userState;
        setWhitelistState(whitelistStatus);
        setUser({ ...user, ...userState });

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
  }, [user, setUser, account]);
  useInterval(updateWhitelist, whitelistIntervalTime);

  useEffect(() => {
    updateWhitelist();
  }, [account]);

  const getTiersLimitValues = useCallback(() => {
    (async () => {
      const tiersLimit = await getTiersLimit();
      setTiers(tiersLimit);
    })();
  }, []);

  useEffect(() => {
    getTiersLimitValues();
  }, []);

  const asWrappedTransaction = useCallback(
    (wrappedTransactionType, transactionFn) => {
      return async function wrappedAction() {
        if (ongoingTransactionType !== null) {
          throw new Error(
            `Attempted to ${wrappedTransactionType} while transaction to ${ongoingTransactionType} is ongoing`
          );
        }

        if (ONBOARDING_MODE !== "DISABLED") {
          // Whitelist is enabled, check for kind of onboaridng method and either show
          // the modal to apply for the whitelist, or (temporarily) throw an error to indicate
          // that the user has to "create an account" before being able to trade.

          if (whitelistState !== "WHITELISTED") {
            if (ONBOARDING_MODE === "WHITELIST") {
              // Whitelist Mode means show Modal for whitelisting options
              openModal("applyBeta", { whitelistState });
            } else if (ONBOARDING_MODE === "TIERED") {
              // If mode is Tiered we have to open SDD KYC Modal
              openModal("KYC");
            } else {
              // Future-proofing: default error handling shows an error indicating
              // that the user needs to be registered/whitelist before being able to trade
              addToast(
                <>
                  Trading not allowed for your wallet.
                  <br />
                  Please follow our onboarding process before participating in
                  trades.
                </>,
                "error"
              );
            }

            return;
          }
        }

        try {
          addToast("Transaction processing...", "info");
          setOngoingTransactionType(wrappedTransactionType);
          const transactionResult = await transactionFn();
          if (transactionResult && transactionResult.modal) {
            openModal(transactionResult.modal, transactionResult.modalProps);
          } else {
            addToast("Transaction confirmed.", "success");
          }
        } catch (e) {
          if (e instanceof ToastifyError) {
            addToast(
              <>
                {e.message}
                <br />
              </>,
              "error"
            );
          } else {
            addToast(
              <>
                Unfortunately, the transaction failed.
                <br />
              </>,
              "error"
            );
          }
          throw e;
        } finally {
          setOngoingTransactionType(null);
          setStagedTransactionType(null);
          triggerSync();
        }
      };
    },
    [whitelistState, setOngoingTransactionType, ongoingTransactionType]
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
        <ComponentClass
          closeModal={closeModal}
          openModal={openModal}
          reinit={init}
          {...options}
        />
      );
    } catch (err) {
      // eslint-disable-next-line
      console.error(err.message);
      setLoading("ERROR");
    }
  }, []);
  window.openModal = openModal;

  useInterval(updateToasts, 1000);

  const { data: queryData } = useSubscription(GET_TRADES_BY_MARKET_MAKER, {
    variables: { marketMaker: lmsrAddress }
  });
  // Load page even when we get no response from thegraph
  const tradeHistory = queryData && queryData.outcomeTokenTrades;

  const isInResolvedMode =
    markets && markets.every(({ status }) => status === "RESOLVED");

  if (loading === "SUCCESS") {
    return (
      <div className={cx("page")}>
        <div className={cx("modal-space", { "modal-open": !!modal })}>
          {modal}
        </div>
        <div className={cx("app-space", { "modal-open": !!modal })}>
          {SHOW_WHITELIST_HEADER && (
            <ApplyBetaHeader
              openModal={openModal}
              whitelistState={whitelistState}
            />
          )}
          <Header
            avatar={
              <UserWallet
                address={account}
                openModal={openModal}
                whitelistState={whitelistState}
                collateral={collateral}
                collateralBalance={collateralBalance}
                setProvider={setProvider}
              />
            }
            openModal={openModal}
            menu={<Menu />}
          />
          <div className={cx("sections")}>
            <section className={cx("section", "section-markets")}>
              <MarketTable
                {...{
                  markets,
                  marketResolutionStates,
                  positions,
                  marketSelections,
                  setMarketSelections,
                  stagedTradeAmounts,
                  resetMarketSelections,
                  addToast,
                  tradeHistory
                }}
              />
            </section>
            {(account != null || isInResolvedMode) && ( // account available or show resolution state
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
                    stagedTradeAmounts,
                    setStagedTradeAmounts,
                    stagedTransactionType,
                    setStagedTransactionType,
                    ongoingTransactionType,
                    asWrappedTransaction,
                    setMarketSelections,
                    resetMarketSelections,
                    addToast,
                    openModal,
                    tradeHistory
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
    );
  }

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
