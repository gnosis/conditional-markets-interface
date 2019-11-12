import React, { useState, useEffect, useCallback } from "react";
import { hot } from "react-hot-loader/root";
import cn from "classnames/bind";
import useInterval from "@use-it/interval";

import Logo from "assets/img/conditional-logo.png";
import Spinner from "components/Spinner";
import CrashPage from "components/Crash";
import makeLoadable from "../utils/make-loadable";
import loadContracts from "loadContracts";
import { loadWeb3 } from "utils/web3";
import {
  getCollectionId,
  getPositionId,
  combineCollectionIds
} from "utils/getIdsUtil";
import { getWhitelistState } from "api/whitelist";
import { getQuestions } from "api/operator";

import style from "./root.scss";
const cx = cn.bind(style);

import getMarketMakersRepo from "../repositories/MarketMakersRepo";
import getConditionalTokensRepo from "../repositories/ConditionalTokensRepo";
import getConditionalTokensService from "../services/ConditionalTokensService";
let marketMakersRepo;
let conditionalTokensRepo;
let conditionalTokensService;

const whitelistEnabled = process.env.WHITELIST_ENABLED;

async function loadBasicData({ lmsrAddress }, web3) {
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
  marketMakersRepo = await getMarketMakersRepo();
  conditionalTokensRepo = await getConditionalTokensRepo();
  conditionalTokensService = await getConditionalTokensService();
  const { collateralToken: collateral } = await loadContracts();

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
        `condition ${conditionId} outcome slot count ${numSlots} does not match market outcome descriptions array with length ${market.outcomes.length}`
      );

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
    // TODO delete when tests passed (should be correctly working now)
    // soliditySha3(
    //   { t: "address", v: collateral.address },
    //   {
    //     t: "uint",
    //     v: outcomes
    //       .map(({ collectionId }) => collectionId)
    //   }
    // );
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
  return { owner, funding, stage, fee, positionBalances };
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

const RootComponent = ({ childComponents }) => {
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
  useInterval(triggerSync, 8000);
  const [toasts, setToasts] = useState([]);

  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [collateral, setCollateral] = useState(null);
  const [markets, setMarkets] = useState(null);
  const [positions, setPositions] = useState(null);

  const init = useCallback(() => {
    import(`../conf`)
      .then(async ({ default: config }) => {
        /* eslint-disable no-console */
        console.groupCollapsed("Configuration");
        console.log(config);
        console.groupEnd();

        /* eslint-enable no-console */
        const { web3, account } = await loadWeb3(config.networkId);

        setWeb3(web3);
        setAccount(account);

        const { collateral, markets, positions } = await loadBasicData(
          config,
          web3
        );

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

  const [whitelistState, setWhitelistState] = useState("LOADING");
  const [whitelistIntervalTime, setWhitelistCheckIntervalTime] = useState(
    30000
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
    }
  }, [account]);
  useInterval(updateWhitelist, whitelistIntervalTime);

  useEffect(() => {
    updateWhitelist();
  }, [account]);

  useInterval(updateToasts, 1000);

  if (loading === "SUCCESS")
    return (
      <div className={cx("page")}>
        <div className={cx("modal-space", { "modal-open": !!modal })}>
          <img className={cx("logo")} src={Logo} />
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
                  marketSelections,
                  setMarketSelections,
                  stagedTradeAmounts,
                  resetMarketSelections,
                  addToast,
                  openModal
                }}
              />
            </section>
            {account != null && // account available
            (!whitelistEnabled || whitelistState === "WHITELISTED") && ( // whitelisted or whitelist functionality disabled
                <section className={cx("section", "section-positions")}>
                  <Sidebar
                    {...{
                      account,
                      markets,
                      positions,
                      marketResolutionStates,
                      marketSelections,
                      collateral,
                      collateralBalance,
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

export default hot(
  makeLoadable(RootComponent, [
    () => import("MarketTable"),
    () => import("Sidebar"),
    () => import("Header"),
    () => import("components/Menu"),
    () => import("components/UserWallet"),
    () => import("components/ApplyBetaHeader"),
    () => import("components/Toasts"),
    () => import("components/Footer")
  ])
);
