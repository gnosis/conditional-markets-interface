import React, { useState, useEffect, useCallback } from "react";
import { hot } from "react-hot-loader/root";
import cn from "classnames/bind";
import useInterval from "@use-it/interval";
import { useSubscription } from "@apollo/react-hooks";

import useGlobalState from "hooks/useGlobalState";
import Spinner from "components/Spinner";
import CrashPage from "components/Crash";
import EmptyPage from "components/Empty";

import makeLoadable from "utils/make-loadable";
import { getAccount, loadWeb3 } from "utils/web3";
import { loadMarketsData } from "utils/getMarketsData";
import ToastifyError from "utils/ToastifyError";
import getWeb3Modal from "utils/web3Modal";
import {
  isCurrentUserUpgrading,
  isCurrentUserActionRequired
} from "utils/tiers";
//import { Notifications as NotificationIcon } from "@material-ui/icons";

import {
  getUserState,
  getCurrentTradingVolume,
  getTiersLimit
} from "api/onboarding";
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
    setTradingVolume,
    markets,
    setMarkets,
    positions,
    setPositions,
    lmsrState,
    setLMSRState,
    collateral,
    setCollateral,
    tiers,
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

  const lmsrAddress = match.params.lmsrAddress;

  const web3Modal = getWeb3Modal(lmsrAddress);

  const init = useCallback(
    async provider => {
      try {
        console.groupCollapsed("Configuration");
        console.log(conf);
        console.groupEnd();

        let web3Provider = provider;
        if (!provider && web3Modal.cachedProvider) {
          // If metamask session is cached but metamask is disabled app may crash
          try {
            web3Provider = await web3Modal.connect();
          } catch (e) {
            // We catch that we were not able to reconnect and force user to connect manually
            console.log("There was an error connecting with cached session");
            web3Modal.clearCachedProvider();
          }
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
      setCollateral(null);
      setMarkets(null);
      setUser(null);
      setConditionalTokensService(null);
      setLMSRState(null);
    }
    if (lmsrAddress) {
      init();
    }
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
    [web3, init]
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

  const getTiersLimitValues = useCallback(() => {
    (async () => {
      const tiersLimit = await getTiersLimit();
      setTiers(tiersLimit);
    })();
  }, []);

  useEffect(() => {
    getTiersLimitValues();
  }, []);

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
        setUser(userState);

        if (
          !isCurrentUserUpgrading(tiers, userState) &&
          !isCurrentUserActionRequired(tiers, userState) &&
          (whitelistStatus === "WHITELISTED" || whitelistStatus === "BLOCKED")
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

  const getTradingVolume = useCallback(() => {
    (async () => {
      const { buyVolume } = await getCurrentTradingVolume(account);
      setTradingVolume(buyVolume);
    })();
  }, [setTradingVolume, account]);

  useEffect(() => {
    getTradingVolume();
  }, [account, syncTime]);

  const doOnboardingCheck = useCallback(() => {
    if (ONBOARDING_MODE === "DISABLED") {
      return true;
    }

    if (whitelistState !== "WHITELISTED") {
      if (ONBOARDING_MODE === "WHITELIST") {
        // Whitelist Mode means show Modal for whitelisting options
        openModal("applyBeta", { whitelistState });
        return false;
      } else if (ONBOARDING_MODE === "TIERED") {
        // If mode is Tiered we have to open SDD KYC Modal
        openModal("KYC");
        return false;
      } else {
        // Future-proofing: default error handling shows an error indicating
        // that the user needs to be registered/whitelist before being able to trade
        addToast(
          <>
            Trading not allowed for your wallet.
            <br />
            Please follow our onboarding process before participating in trades.
          </>,
          "error"
        );
        return false;
      }
    } else {
      return true;
    }
  }, [whitelistState, addToast, openModal]);

  /**
   * @typedef {Object} TransactionDescriptor
   * @property {function|Promise} precheck - Precheck function if transaction can be run
   * @property {function|Promise} commit - This function will run the actual transaction
   * @property {function|Promise} cleanup - Function to call after commit (not called if precheck failed)
   * @property {string} name - Name of the Transaction
   */
  const stageTransactions = useCallback(
    (stagedTransactionType, transactionDescriptors) => {
      return (async () => {
        const transactionAllowed = doOnboardingCheck();

        if (!transactionAllowed) {
          // Transactions not allowed yet. Return false.
          // TODO: Create list of transaction names that require onboarding check
          //       for example a message signature during On-Boaridng would not work
          //       with this method, as it would get denied because the user isnt onboarded.
          return;
        }

        if (ongoingTransactionType !== null) {
          throw new Error(
            `Attempted to ${stagedTransactionType} while transaction to ${ongoingTransactionType} is ongoing`
          );
        }
        setStagedTransactionType(stagedTransactionType);

        // Run "Precheck" for all transaction to determine if they're not necessary or if they can't be executed.
        const transactionPrecheckResults = await Promise.all(
          transactionDescriptors.map(async ({ precheck, name }) => {
            if (precheck == null) {
              // no precheck means allowed
              return true;
            }

            try {
              const result = await precheck();
              // Result can be:
              // false-y:    Transaction is allowed
              // object:     Containing `modal` and `modalProps` to open a modal

              return result;
            } catch (err) {
              if (!(err instanceof ToastifyError)) {
                // Anything other than a toastify error is an application error
                console.warn(
                  `Error during Transaction Precheck for "${name}":`,
                  err.message
                );
              }
              return err;
            }
          })
        );

        let cancel = false;
        const applicableTransactions = [];
        transactionPrecheckResults.forEach((result, index) => {
          if (result === false) {
            // falsey return indicates this transaction is not neccesary to be executed
          } else if (result instanceof ToastifyError) {
            addToast(
              // User Error (hopefully)
              <>
                {result.message}
                <br />
              </>,
              "error"
            );
            cancel = true;
          } else if (result instanceof Error) {
            // Error during precheck, throw error for implementation to handle
            throw result; // Actual Error
          } else if (result instanceof Object) {
            // Precheck result can also be object describing a modal to open
            if (result.modal) {
              openModal(result.modal, result.modalProps || {});
            } else {
              console.warn(
                `Warning: Precheck result of type object but no modal description?`,
                result
              );
            }
            cancel = true;
          } else {
            // If undefined or truthy result, append to applicable transactions
            applicableTransactions.push(transactionDescriptors[index]);
          }
        });

        if (cancel) {
          // Above logic might cancel transaction, if a modal was opened
          setStagedTransactionType(null);
          return;
        }

        if (!applicableTransactions.length) {
          // No applicable transactions? Kinda weird, shouldn't happen.
          // Means all transactions were deemed unnecessary (error case is handled before)
          console.warn("Warning: All Transactions were deemed unneccesary?");
          console.log(transactionPrecheckResults);
          setStagedTransactionType(null);
          return;
        }

        // A bit hacky:
        // We need an array of promises, which will be resolved by the
        // transaction modal over time, so that this function can be
        // awaited until all modals have been completed, before returning
        // back to the function that called `stageTransactions`

        const deferredPromises = [];
        const applicableTxPromises = [];

        applicableTransactions.forEach(() => {
          applicableTxPromises.push(
            new Promise((resolve, reject) => {
              deferredPromises.push({
                resolve,
                reject
              });
            })
          );
        });

        // Wrap Transactions
        const wrappedApplicableTransactions = applicableTransactions.map(
          ({ commit, cleanup, name, ...rest }, index) => {
            return {
              ...rest,
              name,
              execute: async () => {
                const cancelThisToast = addToast(
                  <>
                    Transaction waiting to be signed:
                    <br />
                    <strong>{name}</strong>
                  </>,
                  "warning"
                );
                try {
                  const txResult = await commit();
                  deferredPromises[index].resolve(txResult);

                  if (txResult && txResult.modal) {
                    openModal(txResult.modal, txResult.modalProps || {});
                  }
                  addToast("Transaction confirmed.", "success");

                  if (typeof cleanup === "function") {
                    await cleanup(txResult);
                  }
                } catch (err) {
                  console.warn(`Execution failed for ${name}:`);
                  console.warn(err);
                  if (err instanceof ToastifyError) {
                    addToast(
                      // User Error (hopefully)
                      <>
                        {err.message}
                        <br />
                      </>,
                      "error"
                    );
                  } else {
                    addToast("Transaction failed.", "error");
                  }
                  deferredPromises[index].reject(err);
                } finally {
                  // close toast if resolved before toast fades
                  cancelThisToast();
                }
              }
            };
          }
        );

        // If we only have one transaction, do not open the modal. Simply execute it.
        if (wrappedApplicableTransactions.length === 1) {
          await wrappedApplicableTransactions[0].execute();
        } else {
          // Open Transactions modals, passing all applicable transactions
          openModal("Transactions", {
            transactions: wrappedApplicableTransactions
          });

          await Promise.all(applicableTxPromises);
        }
        setStagedTransactionType(null);
      })();
    },
    [ongoingTransactionType, doOnboardingCheck, addToast, openModal]
  );

  const old_asWrappedTransaction = useCallback(
    (wrappedTransactionType, transactionFn) => {
      return async function wrappedAction() {
        if (ongoingTransactionType !== null) {
          throw new Error(
            `Attempted to ${wrappedTransactionType} while transaction to ${ongoingTransactionType} is ongoing`
          );
        }

        // Can the transaction be run?
        const transactionAllowed = doOnboardingCheck();

        if (!transactionAllowed) {
          return;
        }

        // Decide if we need to show transaction modal
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
    toastId => {
      setToasts(prevToasts => [
        ...prevToasts.filter(({ id }) => toastId !== id)
      ]);

      updateToasts();
    },
    [setToasts, toasts]
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

      // return cancel function
      return () => deleteToast(toastId);
    },
    [toasts, deleteToast]
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

  if (!lmsrAddress) {
    return (
      <div className={cx("page")}>
        <div className={cx("modal-space", { "modal-open": !!modal })}>
          {modal}
        </div>
        <EmptyPage />
      </div>
    );
  }

  if (loading === "SUCCESS") {
    return (
      <div className={cx("page")}>
        <div>
          <Toasts
            deleteToast={deleteToast}
            addToast={addToast}
            toasts={toasts}
          />
        </div>
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
                lmsrAddress={lmsrAddress}
                openModal={openModal}
                whitelistState={whitelistState}
                collateral={collateral}
                collateralBalance={collateralBalance}
                setProvider={setProvider}
                updateWhitelist={updateWhitelist}
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
                    asWrappedTransaction: old_asWrappedTransaction,
                    stageTransactions,
                    setMarketSelections,
                    resetMarketSelections,
                    addToast,
                    openModal,
                    tradeHistory
                  }}
                />
              </section>
            )}
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
