import("normalize.css/normalize.css");
import("./style.scss");

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

async function loadWeb3() {
  const { default: Web3 } = await import("web3");
  const web3 =
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
      ? new Web3("http://localhost:8545")
      : typeof window.ethereum !== "undefined"
      ? (window.ethereum.enable(), new Web3(window.ethereum))
      : new Web3(window.web3.currentProvider);

  // attempt to get the main account here
  // so that web3 will emit an error if e.g.
  // the localhost provider cannot be reached
  const account = await getAccount(web3);

  return { web3, account };
}

async function loadBasicData(web3, Decimal) {
  const { soliditySha3 } = web3.utils;

  const [
    { lmsrAddress, markets, networkId },
    { default: TruffleContract },
    { product },
    ERC20DetailedArtifact,
    WETH9Artifact,
    PredictionMarketSystemArtifact,
    LMSRMarketMakerArtifact
  ] = await Promise.all([
    import("../config.json"),
    import("truffle-contract"),
    import("./utils/itertools"),
    import("../../build/contracts/ERC20Detailed.json"),
    import("../../build/contracts/WETH9.json"),
    import("../../build/contracts/PredictionMarketSystem.json"),
    import("../../build/contracts/LMSRMarketMaker.json")
  ]);

  const ERC20Detailed = TruffleContract(ERC20DetailedArtifact);
  const WETH9 = TruffleContract(WETH9Artifact);
  const PredictionMarketSystem = TruffleContract(
    PredictionMarketSystemArtifact
  );
  const LMSRMarketMaker = TruffleContract(LMSRMarketMakerArtifact);
  for (const Contract of [
    ERC20Detailed,
    WETH9,
    PredictionMarketSystem,
    LMSRMarketMaker
  ]) {
    Contract.setProvider(web3.currentProvider);
  }

  const lmsrMarketMaker = await LMSRMarketMaker.at(lmsrAddress);

  const collateral = {};
  collateral.address = await lmsrMarketMaker.collateralToken();
  collateral.contract = await ERC20Detailed.at(collateral.address);
  collateral.name = await collateral.contract.name();
  collateral.symbol = await collateral.contract.symbol();
  collateral.decimals = (await collateral.contract.decimals()).toNumber();
  collateral.toUnitsMultiplier = new Decimal(10).pow(collateral.decimals);
  collateral.fromUnitsMultiplier = new Decimal(10).pow(-collateral.decimals);

  collateral.isWETH =
    collateral.name === "Wrapped Ether" &&
    collateral.symbol === "WETH" &&
    collateral.decimals === 18;

  // TODO: DAI: \u25C8
  if (collateral.isWETH) {
    collateral.symbol = "\u039E";
    collateral.contract = await WETH9.at(collateral.address);
  }

  const pmSystem = await PredictionMarketSystem.deployed();
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
    web3,
    networkId,
    pmSystem,
    lmsrMarketMaker,
    collateral,
    markets,
    positions
  };
}

async function getAccount(web3) {
  if (web3.defaultAccount == null) {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) {
      throw new Error(`got no accounts from ethereum provider`);
    }
    return accounts[0];
  }
  return web3.defaultAccount;
}

async function validateNetworkId(web3, networkId) {
  const web3NetworkId = await web3.eth.net.getId();
  if (web3NetworkId != networkId)
    throw new Error(
      `interface expects ${networkId} but currently connected to ${web3NetworkId}`
    );
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
  import("classnames"),
  import("decimal.js-light"),
  import("./markets"),
  import("./buy-section"),
  import("./your-positions"),
  import("./spinner")
]).then(
  ([
    { default: React, useState, useEffect },
    { render },
    { default: cn },
    { default: Decimal },
    { default: Markets },
    { default: BuySection },
    { default: YourPositions },
    { default: Spinner }
  ]) => {
    Decimal.config({
      precision: 80,
      rounding: Decimal.ROUND_FLOOR
    });

    const moduleLoadTime = Date.now();

    function RootComponent() {
      const [loading, setLoading] = useState("LOADING");
      const [syncTime, setSyncTime] = useState(moduleLoadTime);
      function triggerSync() {
        setSyncTime(Date.now());
      }

      const [networkId, setNetworkId] = useState(null);
      const [web3, setWeb3] = useState(null);
      const [account, setAccount] = useState(null);
      const [pmSystem, setPMSystem] = useState(null);
      const [lmsrMarketMaker, setLMSRMarketMaker] = useState(null);
      const [collateral, setCollateral] = useState(null);
      const [markets, setMarkets] = useState(null);
      const [positions, setPositions] = useState(null);

      useEffect(() => {
        loadWeb3()
          .then(
            ({ web3, account }) => (
              setWeb3(web3), setAccount(account), loadBasicData(web3, Decimal)
            )
          )
          .then(
            async ({
              web3,
              networkId,
              pmSystem,
              lmsrMarketMaker,
              collateral,
              markets,
              positions
            }) => {
              setNetworkId(networkId);
              setPMSystem(pmSystem);
              setLMSRMarketMaker(lmsrMarketMaker);
              setCollateral(collateral);
              setMarkets(markets);
              setPositions(positions);

              await validateNetworkId(web3, networkId);
              setLoading("SUCCESS");
            }
          )
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
            triggerSync();
          }
        };
      }

      if (loading === "SUCCESS")
        return (
          <div className={cn("page")}>
            <section className={cn("section", "market-section")}>
              <h1 className={cn("page-title")}>Gnosis PM 2.0 Experiments</h1>
              <Markets
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
            <div className={cn("seperator")} />
            <section className={cn("section", "position-section")}>
              <h2 className={cn("heading")}>Manage Positions</h2>
              <BuySection
                {...{
                  account,
                  markets,
                  positions,
                  collateral,
                  collateralBalance,
                  lmsrMarketMaker,
                  lmsrState,
                  lmsrAllowance,
                  marketSelections,
                  stagedTradeAmounts,
                  setStagedTradeAmounts,
                  stagedTransactionType,
                  setStagedTransactionType,
                  ongoingTransactionType,
                  asWrappedTransaction
                }}
              />
              <YourPositions
                {...{
                  account,
                  pmSystem,
                  markets,
                  marketResolutionStates,
                  positions,
                  collateral,
                  lmsrMarketMaker,
                  lmsrState,
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
          </div>
        );

      if (loading === "LOADING")
        return (
          <div className={cn("loading-page")}>
            <Spinner centered inverted width={100} height={100} />
          </div>
        );
      if (loading === "FAILURE")
        return (
          <div className={cn("failure-page")}>
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
