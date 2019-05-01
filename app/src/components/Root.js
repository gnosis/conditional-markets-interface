import React, { useState, useEffect } from "react";
import { hot } from "react-hot-loader";
import Decimal from "decimal.js";

import Markets from "./Markets";
import BuySection from "./BuySection";
import YourPositions from "./YourPositions";

import Spinner from "./Spinner";

import {
  loadMarkets,
  loadCollateral,
  loadMarginalPrices,
  loadProbabilitiesForPredictions,
  buyOutcomes,
  sellOutcomes
} from "../api/markets";
import {
  loadBalances,
  loadPositions,
  loadAllowance,
  generatePositionList,
  listOutcomePairsMatchingOutcomeId,
  calcOutcomeTokenCounts,
  getCollateralBalance,
  setAllowanceInsanelyHigh,
  calcProfitForSale
} from "../api/balances";

import css from "./style.scss";
import cn from "classnames/bind";
const cx = cn.bind(css);

const moduleLoadTime = Date.now();
const RootComponent = () => {
  const [loading, setLoading] = useState("LOADING");
  const [syncTime, setSyncTime] = useState(moduleLoadTime);

  const [prices, setPrices] = useState(null);
  const [markets, setMarkets] = useState(null);
  const [positionIds, setPositionIds] = useState(null);
  const [balances, setBalances] = useState(null);
  const [positions, setPositions] = useState(null);
  const [collateral, setCollateral] = useState(null);
  const [allowanceAvailable, setAllowanceAvailable] = useState(null);

  for (const [loader, dependentParams, setter] of [
    [loadCollateral, [], setCollateral],
    [loadMarginalPrices, [], setPrices],
    [loadMarkets, [prices], setMarkets],
    [loadPositions, [], setPositionIds],
    [loadBalances, [positionIds], setBalances],
    [generatePositionList, [markets, balances], setPositions],
    [loadAllowance, [], setAllowanceAvailable],
    [
      () => Promise.resolve(loading === "LOADING" ? "SUCCESS" : loading),
      [
        prices,
        markets,
        positionIds,
        balances,
        positions,
        collateral,
        allowanceAvailable
      ],
      setLoading
    ]
  ])
    useEffect(() => {
      if (dependentParams.every(p => p != null))
        loader(...dependentParams)
          .then(setter)
          .catch(err => {
            setLoading("FAILURE");
            throw err;
          });
    }, [...dependentParams, syncTime]);

  const [assumptions, setAssumptions] = useState([]);
  function removeAssumption(conditionIdToRemove) {
    // no error will be thrown if condition is not found
    // because this may be called with an unassumed condition
    // (when user switches to "I don't know" from "Yes" or "No")
    if (assumptions.includes(conditionIdToRemove))
      setAssumptions(
        assumptions.filter(conditionId => conditionId !== conditionIdToRemove)
      );
  }

  const [selectedOutcomes, setSelectedOutcomes] = useState({});

  useEffect(() => {
    (async function updatedMarkets() {
      if (prices == null) return;

      const assumedOutcomeIndexes = [];

      Object.keys(selectedOutcomes).forEach(targetConditionId => {
        if (assumptions.includes(targetConditionId)) {
          const marketIndex = markets.findIndex(
            ({ conditionId }) => conditionId == targetConditionId
          );
          let lmsrOutcomeIndex = 0;
          for (let i = 0; i < marketIndex; i++)
            lmsrOutcomeIndex += markets[marketIndex].outcomes.length;

          const selectedOutcome = parseInt(
            selectedOutcomes[targetConditionId],
            10
          );
          assumedOutcomeIndexes.push(lmsrOutcomeIndex + selectedOutcome);
        }
      });
      const marketsWithAssumptions = await loadMarkets(
        prices,
        assumedOutcomeIndexes
      );
      setMarkets(marketsWithAssumptions);
    })();
  }, [prices, selectedOutcomes, assumptions]);

  const [invest, setInvest] = useState("");
  const [outcomeTokenBuyAmounts, setOutcomeTokenBuyAmounts] = useState([]);
  const [predictionProbabilities, setPredictionProbabilities] = useState([]);
  const [stagedPositions, setStagedPositions] = useState([]);

  useEffect(() => {
    (async function updateOutcomeTokenCounts() {
      const amount = invest || "0";

      const amountValid = !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;

      if (!amountValid) return;

      const outcomeIndexes = [];
      const assumedIndexes = [];

      // transform selectedOutcomes into outcomeIndex array, filtering all assumptions
      let totalOutcomeIndex = 0;
      markets.forEach(market => {
        if (selectedOutcomes[market.conditionId] != null) {
          const selectedOutcome = parseInt(
            selectedOutcomes[market.conditionId],
            10
          );

          if (assumptions.includes(market.conditionId)) {
            assumedIndexes.push(totalOutcomeIndex + selectedOutcome);
          } else {
            outcomeIndexes.push(totalOutcomeIndex + selectedOutcome);
          }
        }

        totalOutcomeIndex += market.outcomes.length;
      });

      // outcome ids:   Ay, .... By, ... Bn
      // atomic outcomes: AyByCn "outcomePairs"

      const outcomePairs = await listOutcomePairsMatchingOutcomeId([
        ...outcomeIndexes,
        ...assumedIndexes
      ]);
      const assumedPairs =
        assumedIndexes.length > 0
          ? await listOutcomePairsMatchingOutcomeId(assumedIndexes, true)
          : [];

      const outcomeTokenCounts = await calcOutcomeTokenCounts(
        outcomePairs,
        assumedPairs,
        amount
      );
      setOutcomeTokenBuyAmounts(outcomeTokenCounts);

      const newPrices = await loadMarginalPrices(outcomeTokenCounts);
      const predictionProbabilities = await loadProbabilitiesForPredictions(
        newPrices
      );

      setPredictionProbabilities(predictionProbabilities);
      const stagedPositions = await generatePositionList(
        markets,
        outcomeTokenCounts
      );
      setStagedPositions(stagedPositions);
    })();
  }, [markets, assumptions, selectedOutcomes, invest]);

  async function handleSelectAssumption(conditionId) {
    if (assumptions.includes(conditionId)) {
      removeAssumption(conditionId);
    } else {
      if (assumptions.length < markets.length - 1) {
        setAssumptions([...assumptions, conditionId]);
      } else {
        alert(
          "You can't make assumptions on all markets at once. You need to make at least one prediction."
        );
      }
    }
  }

  const [validPosition, setValidPosition] = useState(false);
  useEffect(() => {
    (async function updateAffectedOutcomes() {
      if (markets == null || assumptions == null) return;

      const outcomeIndexes = [];
      const assumedIndexes = [];

      // transform selectedOutcomes into outcomeIndex array, filtering all assumptions
      let totalOutcomeIndex = 0;
      markets.forEach(market => {
        if (selectedOutcomes[market.conditionId] != null) {
          const selectedOutcome = parseInt(
            selectedOutcomes[market.conditionId],
            10
          );

          if (assumptions.includes(market.conditionId)) {
            assumedIndexes.push(totalOutcomeIndex + selectedOutcome);
          } else {
            outcomeIndexes.push(totalOutcomeIndex + selectedOutcome);
          }
        }

        totalOutcomeIndex += market.outcomes.length;
      });

      // sets which outcome combinations will be bought
      const outcomePairs = await listOutcomePairsMatchingOutcomeId(
        outcomeIndexes
      );

      // sets if the selected position is valid (ie not all positions and not no positions)
      setValidPosition(
        outcomePairs.length > 0 && outcomePairs.length < totalOutcomeIndex + 1
      );
    })();
  }, [markets, assumptions, selectedOutcomes]);

  async function handleSelectOutcome(e) {
    const [conditionId, outcomeIndex] = e.target.name.split(/[-\]]/g);
    setSelectedOutcomes({
      ...selectedOutcomes,
      [conditionId]: outcomeIndex
    });

    if (outcomeIndex === undefined) {
      removeAssumption(conditionId);
    }
  }

  const [buyError, setBuyError] = useState("");
  async function handleSelectInvest(e) {
    setInvest(e.target.value);
  }

  useEffect(() => {
    (async function updateBuyError() {
      const asNum = parseFloat(invest);
      const isEmpty = invest === "";
      const validNum = !isNaN(asNum) && isFinite(asNum) && asNum > 0;

      if (!isEmpty && validNum) {
        const collateralDecimalDenominator = new Decimal(10).pow(
          collateral.decimals || 18
        );

        const investWei = new Decimal(invest).mul(collateralDecimalDenominator);
        // only needed for WETH? todo
        //const gasEstimate = new Decimal(500000).mul(1e10) // 500.000 gas * 10 gwei gasprice as buffer for invest

        const collateralBalance = await getCollateralBalance();
        const collateralBalanceDecimal = new Decimal(
          collateralBalance.toString()
        );

        const hasEnough = investWei.lte(collateralBalanceDecimal);

        if (!hasEnough) {
          setBuyError(
            `Sorry, you don't have enough balance of ${
              collateral.name
            }. You're missing ${investWei
              .sub(collateralBalanceDecimal)
              .dividedBy(collateralDecimalDenominator)
              .toSD(4)
              .toString()} ${collateral.symbol}`
          );
        } else {
          setBuyError(false);
        }
      }
    })();
  }, [collateral, invest]);

  const [isBuying, setIsBuying] = useState(false);
  async function handleSetAllowance() {
    setIsBuying(true);
    try {
      await setAllowanceInsanelyHigh();
      const allowance = await loadAllowance();
      setAllowanceAvailable(allowance);
    } catch (err) {
      setBuyError("Could not set allowance. Please try again");
      throw err;
    } finally {
      setIsBuying(false);
    }
  }

  async function handleBuyOutcomes() {
    if (isBuying) throw new Error(`attempting to buy while already buying`);

    setIsBuying(true);
    setBuyError("");
    try {
      await buyOutcomes(outcomeTokenBuyAmounts);
    } catch (err) {
      setBuyError(err.message);
      throw err;
    } finally {
      setIsBuying(false);
      setSyncTime(Date.now());
    }
  }

  const [selectedSell, setSelectedSell] = useState(null);
  const [selectedSellAmount, setSelectedSellAmount] = useState("");
  const [predictedSellProfit, setPredictedSellProfit] = useState(null);
  useEffect(() => {
    (async function updateSellProfit() {
      const asNum = parseFloat(selectedSellAmount);

      const isEmpty = selectedSellAmount === "";
      const validNum = !isNaN(asNum) && isFinite(asNum) && asNum > 0;
      if (isEmpty || !validNum) return;

      const targetPosition = positions.find(
        ({ outcomeIds }) => outcomeIds === selectedSell
      );
      const sellAmountDecimal = new Decimal(selectedSellAmount)
        .mul(new Decimal(10).pow(18))
        .floor();
      if (targetPosition && targetPosition.outcomes.length > 0) {
        const estimatedProfit = await calcProfitForSale(
          targetPosition.outcomes.map(positionOutcomeIds => [
            positionOutcomeIds,
            sellAmountDecimal.toString()
          ])
        );
        setPredictedSellProfit(estimatedProfit);
      }
    })();
  }, [positions, selectedSell, selectedSellAmount]);

  async function handleSelectSell(positionOutcomeGrouping) {
    setSelectedSellAmount("");
    setPredictedSellProfit(null);
    setSelectedSell(
      positionOutcomeGrouping === selectedSell ? null : positionOutcomeGrouping
    );
  }

  async function handleSelectSellAmount(e) {
    if (typeof e !== "string") {
      setSelectedSellAmount(e.target.value);
    } else {
      setSelectedSellAmount(e);
    }
  }

  async function handleSellPosition(atomicOutcomes, amount) {
    try {
      await sellOutcomes(atomicOutcomes, amount);
    } finally {
      setSelectedSell(null);
      setSelectedSellAmount("");
      setPredictedSellProfit(null);
      setSyncTime(Date.now());
    }
  }

  if (loading === "SUCCESS")
    return (
      <div className={cx("page")}>
        <section className={cx("section", "market-section")}>
          <h1 className={cx("page-title")}>Gnosis PM 2.0 Experiments</h1>
          <Markets
            {...{
              markets,
              assumptions,
              selectedOutcomes,

              predictionProbabilities,

              handleSelectAssumption,
              handleSelectOutcome
            }}
          />
        </section>
        <div className={cx("seperator")} />
        <section className={cx("section", "position-section")}>
          <h2 className={cx("heading")}>Manage Positions</h2>
          <BuySection
            {...{
              collateral,

              stagedPositions,

              validPosition,
              hasAllowance: allowanceAvailable > 0,
              invest,
              isBuying,
              buyError,

              handleSelectInvest,
              handleSetAllowance,
              handleBuyOutcomes
            }}
          />
          <YourPositions
            {...{
              positions,
              collateral,

              selectedSell,
              selectedSellAmount,
              predictedSellProfit,

              handleSelectSell,
              handleSellPosition,
              handleSelectSellAmount
            }}
          />
        </section>
      </div>
    );

  if (loading === "LOADING")
    return (
      <div style={{ height: "100%", width: "100%" }}>
        <Spinner centered inverted width={100} height={100} />
      </div>
    );
  if (loading === "FAILURE")
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          height: "100vh"
        }}
      >
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
