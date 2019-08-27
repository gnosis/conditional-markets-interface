import cn from "classnames/bind";

// CSS Reset
import "normalize.css/normalize.css";

// Base Style (loads fonts)
import "./scss/style.scss";

import Logo from "assets/img/conditional-logo@3x.png";
import { loadWeb3, getNetworkName } from "utils/web3";

import style from "./index.scss";
const cx = cn.bind(style);

async function loadBasicData({ lmsrAddress, markets }, web3, Decimal) {
  const { soliditySha3 } = web3.utils;

  const [
    { default: TruffleContract },
    { product },
    ERC20DetailedArtifact,
    IDSTokenArtifact,
    WETH9Artifact,
    PredictionMarketSystemArtifact,
    LMSRMarketMakerArtifact
  ] = await Promise.all([
    import("truffle-contract"),
    import("./utils/itertools"),
    import("../../build/contracts/ERC20Detailed.json"),
    import("../../build/contracts/IDSToken.json"),
    import("../../build/contracts/WETH9.json"),
    import("../../build/contracts/PredictionMarketSystem.json"),
    import("../../build/contracts/LMSRMarketMaker.json")
  ]);

  const ERC20Detailed = TruffleContract(ERC20DetailedArtifact);
  const IDSToken = TruffleContract(IDSTokenArtifact);
  const WETH9 = TruffleContract(WETH9Artifact);
  const PredictionMarketSystem = TruffleContract(
    PredictionMarketSystemArtifact
  );
  const LMSRMarketMaker = TruffleContract(LMSRMarketMakerArtifact);
  for (const Contract of [
    ERC20Detailed,
    IDSToken,
    WETH9,
    PredictionMarketSystem,
    LMSRMarketMaker
  ]) {
    Contract.setProvider(web3.currentProvider);
  }

  const lmsrMarketMaker = await LMSRMarketMaker.at(lmsrAddress);

  const collateral = await require("./utils/collateral-info")(
    web3,
    Decimal,
    { ERC20Detailed, IDSToken, WETH9 },
    lmsrMarketMaker
  );

  const pmSystem = await PredictionMarketSystem.at(
    await lmsrMarketMaker.pmSystem()
  );
  const atomicOutcomeSlotCount = (await lmsrMarketMaker.atomicOutcomeSlotCount()).toNumber();

  let curAtomicOutcomeSlotCount = 1;
  for (let i = 0; i < markets.length; i++) {
    const market = markets[i];
    const conditionId = await lmsrMarketMaker.conditionIds(i);
    const numSlots = (await pmSystem.getOutcomeSlotCount(
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
    market.outcomes.forEach((outcome, i) => {
      outcome.collectionId = soliditySha3(
        { t: "bytes32", v: conditionId },
        { t: "uint", v: 1 << i }
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

async function getLMSRState(web3, pmSystem, lmsrMarketMaker, positions) {
  const { fromWei } = web3.utils;
  const [owner, funding, stage, fee, positionBalances] = await Promise.all([
    lmsrMarketMaker.owner(),
    lmsrMarketMaker.funding(),
    lmsrMarketMaker
      .stage()
      .then(stage => ["Running", "Paused", "Closed"][stage.toNumber()]),
    lmsrMarketMaker.fee().then(fee => fromWei(fee)),
    getPositionBalances(pmSystem, positions, lmsrMarketMaker.address)
  ]);
  return { owner, funding, stage, fee, positionBalances };
}

async function getMarketResolutionStates(pmSystem, markets) {
  return await Promise.all(
    markets.map(async ({ conditionId, outcomes }) => {
      const payoutDenominator = await pmSystem.payoutDenominator(conditionId);
      if (payoutDenominator.gtn(0)) {
        const payoutNumerators = await Promise.all(
          outcomes.map((_, outcomeIndex) =>
            pmSystem.payoutNumerators(conditionId, outcomeIndex)
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

async function getPositionBalances(pmSystem, positions, account) {
  return await Promise.all(
    positions.map(position => pmSystem.balanceOf(account, position.id))
  );
}

async function getLMSRAllowance(collateral, lmsrMarketMaker, account) {
  return await collateral.contract.allowance(account, lmsrMarketMaker.address);
}

Promise.all([
  import("react"),
  import("react-dom"),
  import("@use-it/interval"),
  import("decimal.js-light"),
  import("./MarketTable"),
  import("./Sidebar"),
  import("./components/Spinner"),
  import("./Header"),
  import("./components/Menu"),
  import("./components/UserWallet"),
  import("./components/Toasts")
]).then(
  ([
    { default: React, useState, useEffect, useCallback },
    { render },
    { default: useInterval },
    { default: Decimal },
    { default: MarketTable },
    { default: Sidebar },
    { default: Spinner },
    { default: Header },
    { default: Menu },
    { default: UserWallet },
    { default: Toasts }
  ]) => {
    Decimal.config({
      precision: 80,
      rounding: Decimal.ROUND_FLOOR
    });

    const moduleLoadTime = Date.now();

    function RootComponent() {
      const [loading, setLoading] = useState("LOADING");
      const [syncTime, setSyncTime] = useState(moduleLoadTime);
      const triggerSync = useCallback(() => {
        setSyncTime(Date.now());
      });
      useInterval(triggerSync, 2000);
      const [toasts, setToasts] = useState([]);

      const [networkId, setNetworkId] = useState(null);
      const [web3, setWeb3] = useState(null);
      const [account, setAccount] = useState(null);
      const [pmSystem, setPMSystem] = useState(null);
      const [lmsrMarketMaker, setLMSRMarketMaker] = useState(null);
      const [collateral, setCollateral] = useState(null);
      const [markets, setMarkets] = useState(null);
      const [positions, setPositions] = useState(null);

      const init = useCallback(() => {
        import("../config.json")
          .then(async ({ default: config }) => {
            setNetworkId(config.networkId);
            const { web3, account } = await loadWeb3(config.networkId);

            setWeb3(web3);
            setAccount(account);

            const {
              pmSystem,
              lmsrMarketMaker,
              collateral,
              markets,
              positions
            } = await loadBasicData(config, web3, Decimal);

            setPMSystem(pmSystem);
            setLMSRMarketMaker(lmsrMarketMaker);
            setCollateral(collateral);
            setMarkets(markets);
            setPositions(positions);
          })
          .catch(err => {
            setLoading("FAILURE");
            throw err;
          })
          .finally(() => {
            setLoading("SUCCESS");
          });
      }, []);

      useEffect(init, []);

      const [lmsrState, setLMSRState] = useState(null);
      const [marketResolutionStates, setMarketResolutionStates] = useState(
        null
      );
      const [collateralBalance, setCollateralBalance] = useState(null);
      const [positionBalances, setPositionBalances] = useState(null);
      const [lmsrAllowance, setLMSRAllowance] = useState(null);

      const [modal, setModal] = useState(null);

      for (const [loader, dependentParams, setter] of [
        [
          getLMSRState,
          [web3, pmSystem, lmsrMarketMaker, positions],
          setLMSRState
        ],
        [
          getMarketResolutionStates,
          [pmSystem, markets],
          setMarketResolutionStates
        ],
        [
          getCollateralBalance,
          [web3, collateral, account],
          setCollateralBalance
        ],
        [
          getPositionBalances,
          [pmSystem, positions, account],
          setPositionBalances
        ],
        [
          getLMSRAllowance,
          [collateral, lmsrMarketMaker, account],
          setLMSRAllowance
        ]
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

      const [ongoingTransactionType, setOngoingTransactionType] = useState(
        null
      );

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
        (wrappedTransactionType, transactionFn, setError) => {
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
            const targetIndex = prevToasts.findIndex(
              ({ id }) => id === targetId
            );
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
        //setLoading("LOADING");

        try {
          const { default: ComponentClass } = await import(
            `./Modals/${modalName}`
          );
          setModal(<ComponentClass closeModal={closeModal} reinit={init} {...options} />);
          //setLoading("SUCCESS");
        } catch (err) {
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

      if (loading === "LOADING")
        return (
          <div className={cx("loading-page")}>
            <Spinner centered width={100} height={100} />
          </div>
        );
      if (loading === "FAILURE")
        return (
          <div className={cx("failure-page")}>
            <h2>Failed to load 😞</h2>
            <h3>Please check the following:</h3>
            <ul>
              <li>Connect to correct network ({getNetworkName(networkId)})</li>
              <li>Install/Unlock Metamask</li>
            </ul>
          </div>
        );
    }

    const rootElement = document.getElementById("root");
    render(<RootComponent />, rootElement);
  }
);
