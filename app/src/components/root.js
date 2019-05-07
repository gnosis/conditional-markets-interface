import React, { useState, useEffect } from "react";
import { hot } from "react-hot-loader";
import cn from "classnames";
import Decimal from "decimal.js-light";
Decimal.config({
  precision: 80,
  rounding: Decimal.ROUND_FLOOR
});

import Markets from "./markets";
import BuySection from "./buy-section";
import YourPositions from "./your-positions";
import Spinner from "./spinner";

import { product } from "./utils/itertools";

import Web3 from "web3";
const { fromWei, soliditySha3 } = Web3.utils;
const web3 =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
    ? new Web3("http://localhost:8545")
    : typeof window.ethereum !== "undefined"
    ? (window.ethereum.enable(), new Web3(window.ethereum))
    : new Web3(window.web3.currentProvider);

import config from "../../config.json";

import ERC20DetailedArtifact from "../../../build/contracts/ERC20Detailed.json";
import WETH9Artifact from "../../../build/contracts/WETH9.json";
import PredictionMarketSystemArtifact from "../../../build/contracts/PredictionMarketSystem.json";
import LMSRMarketMakerArtifact from "../../../build/contracts/LMSRMarketMaker.json";
import TruffleContract from "truffle-contract";

const ERC20Detailed = TruffleContract(ERC20DetailedArtifact);
const WETH9 = TruffleContract(WETH9Artifact);
const PredictionMarketSystem = TruffleContract(PredictionMarketSystemArtifact);
const LMSRMarketMaker = TruffleContract(LMSRMarketMakerArtifact);
for (const Contract of [
  ERC20Detailed,
  WETH9,
  PredictionMarketSystem,
  LMSRMarketMaker
]) {
  Contract.setProvider(web3.currentProvider);
}

async function loadBasicData() {
  const { lmsrAddress, markets } = config;

  const lmsrMarketMaker = await LMSRMarketMaker.at(lmsrAddress);

  const collateral = {};
  collateral.address = await lmsrMarketMaker.collateralToken();
  collateral.contract = await ERC20Detailed.at(collateral.address);
  collateral.name = await collateral.contract.name();
  collateral.symbol = await collateral.contract.symbol();
  collateral.decimals = (await collateral.contract.decimals()).toNumber();

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
      .map(({ conditionId, outcomes }, marketIndex) =>
        outcomes.map((outcome, outcomeIndex) => ({
          ...outcome,
          conditionId,
          marketIndex,
          outcomeIndex
        }))
      )
  )) {
    const positionId = web3.utils.soliditySha3(
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

  return { pmSystem, lmsrMarketMaker, collateral, markets, positions };
}

async function getAccount() {
  if (web3.defaultAccount == null) {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) {
      throw new Error(`got no accounts from ethereum provider`);
    }
    return accounts[0];
  }
  return web3.defaultAccount;
}

async function getCollateralBalance(collateral, account) {
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

async function getLMSRState(pmSystem, lmsrMarketMaker, positions) {
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

async function getPositionBalances(pmSystem, positions, account) {
  return await Promise.all(
    positions.map(position => pmSystem.balanceOf(account, position.id))
  );
}

async function getLMSRAllowance(collateral, lmsrMarketMaker, account) {
  return await collateral.contract.allowance(account, lmsrMarketMaker.address);
}

const moduleLoadTime = Date.now();
const RootComponent = () => {
  const [loading, setLoading] = useState("LOADING");
  const [syncTime, setSyncTime] = useState(moduleLoadTime);
  function triggerSync() {
    setSyncTime(Date.now());
  }

  const [pmSystem, setPMSystem] = useState(null);
  const [lmsrMarketMaker, setLMSRMarketMaker] = useState(null);
  const [collateral, setCollateral] = useState(null);
  const [markets, setMarkets] = useState(null);
  const [positions, setPositions] = useState(null);

  useEffect(() => {
    loadBasicData()
      .then(({ pmSystem, lmsrMarketMaker, collateral, markets, positions }) => {
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

  const [account, setAccount] = useState(null);
  const [lmsrState, setLMSRState] = useState(null);
  const [collateralBalance, setCollateralBalance] = useState(null);
  const [positionBalances, setPositionBalances] = useState(null);
  const [lmsrAllowance, setLMSRAllowance] = useState(null);

  for (const [loader, dependentParams, setter] of [
    [getAccount, [], setAccount],
    [getLMSRState, [pmSystem, lmsrMarketMaker, positions], setLMSRState],
    [getCollateralBalance, [collateral, account], setCollateralBalance],
    [getPositionBalances, [pmSystem, positions, account], setPositionBalances],
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
              positions,
              collateral,
              lmsrMarketMaker,
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
          <li>Connect to correct network (Rinkeby or Mainnet)</li>
          <li>Install/Unlock Metamask</li>
        </ul>
      </div>
    );
};

export default hot(module)(RootComponent);
