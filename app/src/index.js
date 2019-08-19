import cn from "classnames/bind";

// CSS Reset
import "normalize.css/normalize.css";

// Base Style (loads fonts)
import "./scss/style.scss";

import style from "./index.scss";
const cx = cn.bind(style);

function getNetworkName(networkId) {
  // https://ethereum.stackexchange.com/a/17101
  return (
    {
      [0]: "Olympic",
      [1]: "Mainnet",
      [2]: "Morden Classic",
      [3]: "Ropsten",
      [4]: "Rinkeby",
      [5]: "Goerli",
      [6]: "Kotti Classic",
      [8]: "Ubiq",
      [42]: "Kovan",
      [60]: "GoChain",
      [77]: "Sokol",
      [99]: "Core",
      [100]: "xDai",
      [31337]: "GoChain testnet",
      [401697]: "Tobalaba",
      [7762959]: "Musicoin",
      [61717561]: "Aquachain"
    }[networkId] || `Network ID ${networkId}`
  );
}

function getReadOnlyProviderForNetworkId(networkId) {
  const providerName = {
    [1]: "mainnet",
    [3]: "ropsten",
    [4]: "rinkeby",
    [5]: "goerli",
    [42]: "kovan"
  }[networkId];

  return providerName == null
    ? null
    : `wss://${providerName}.infura.io/ws/v3/d743990732244555a1a0e82d5ab90c7f`;
}

async function loadWeb3(networkId) {
  const { default: Web3 } = await import("web3");

  const web3InitErrors = [];
  let web3, account;
  let foundWeb3 = false;
  for (const [providerType, providerCandidate] of [
    ["injected provider", Web3.givenProvider],
    ["local websocket", "ws://localhost:8546"],
    ["local http", "http://localhost:8545"],
    [
      `read-only for id ${networkId}`,
      getReadOnlyProviderForNetworkId(networkId)
    ]
  ]) {
    try {
      if (providerCandidate == null) throw new Error("no provider found");
      if (providerCandidate.enable != null) await providerCandidate.enable();

      web3 = new Web3(providerCandidate);
      const web3NetworkId = await web3.eth.net.getId();
      if (web3NetworkId != networkId)
        throw new Error(
          `interface expects ${networkId} but currently connected to ${web3NetworkId}`
        );

      // attempt to get the main account here
      // so that web3 will emit an error if e.g.
      // the localhost provider cannot be reached
      if (web3.defaultAccount == null) {
        const accounts = await web3.eth.getAccounts();
        account = accounts[0] || null;
      } else account = web3.defaultAccount;

      foundWeb3 = true;
      break;
    } catch (e) {
      web3InitErrors.push([providerType, e]);
    }
  }

  if (!foundWeb3)
    throw new Error(
      `could not get valid Web3 instance; got following errors:\n${web3InitErrors
        .map(([providerCandidate, e]) => `${providerCandidate} -> ${e}`)
        .join("\n")}`
    );

  return { web3, account };
}

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
  import("./header"),
  import("./components/Menu"),
  import("./components/UserWallet")
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
    { default: UserWallet }
  ]) => {
    Decimal.config({
      precision: 80,
      rounding: Decimal.ROUND_FLOOR
    });

    const moduleLoadTime = Date.now();

    function RootComponent() {
      const [loading, setLoading] = useState("LOADING");
      const [syncTime, setSyncTime] = useState(moduleLoadTime);

      const [networkId, setNetworkId] = useState(null);
      const [web3, setWeb3] = useState(null);
      const [account, setAccount] = useState(null);
      const [pmSystem, setPMSystem] = useState(null);
      const [lmsrMarketMaker, setLMSRMarketMaker] = useState(null);
      const [collateral, setCollateral] = useState(null);
      const [markets, setMarkets] = useState(null);
      const [positions, setPositions] = useState(null);

      useEffect(() => {
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

            setLoading("SUCCESS");
          })
          .catch(err => {
            setLoading("FAILURE");
            throw err;
          });
      }, []);

      const [lmsrState, setLMSRState] = useState(null);
      const [marketResolutionStates, setMarketResolutionStates] = useState(
        null
      );
      const [collateralBalance, setCollateralBalance] = useState(null);
      const [positionBalances, setPositionBalances] = useState(null);
      const [lmsrAllowance, setLMSRAllowance] = useState(null);

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
      function asWrappedTransaction(
        wrappedTransactionType,
        transactionFn,
        setError
      ) {
        return async function wrappedAction() {
          if (ongoingTransactionType != null) {
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
            //triggerSync();
          }
        };
      }

      if (loading === "SUCCESS")
        return (
          <div className={cx("page")}>
            <Header avatar={<UserWallet address={account} />} menu={<Menu />} />
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
                    stagedTradeAmounts
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
                      asWrappedTransaction
                    }}
                  />
                </section>
              )}
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
