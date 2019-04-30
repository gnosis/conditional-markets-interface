import React, { useState, useEffect } from "react";
import { hot } from "react-hot-loader";
import Decimal from "decimal.js";

import Page from "./Page";
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

const RootComponent = () => {
  const [loading, setLoading] = useState("LOADING");

  const [prices, setPrices] = useState(null);
  const [markets, setMarkets] = useState(null);
  const [positionIds, setPositionIds] = useState(null);
  const [balances, setBalances] = useState(null);
  const [positions, setPositions] = useState(null);
  const [collateral, setCollateral] = useState(null);
  const [allowanceAvailable, setAllowanceAvailable] = useState(null);

  for (const [loader, dependentParams, setter] of [
    [loadMarginalPrices, [], setPrices],
    [loadMarkets, [prices], setMarkets],
    [loadPositions, [], setPositionIds],
    [loadBalances, [positionIds], setBalances],
    [generatePositionList, [markets, balances], setPositions],
    [loadCollateral, [], setCollateral],
    [loadAllowance, [], setAllowanceAvailable],
    [
      () => Promise.resolve("SUCCESS"),
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
    }, dependentParams);

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

  async function updateMarkets() {
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
  }

  const [outcomeTokenBuyAmounts, setOutcomeTokenBuyAmounts] = useState([]);
  const [predictionProbabilities, setPredictionProbabilities] = useState([]);
  const [stagedPositions, setStagedPositions] = useState([]);
  const [invest, setInvest] = useState("");

  async function updateOutcomeTokenCounts(amount) {
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
  }

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

    await updateMarkets();
    await updateOutcomeTokenCounts(invest || "0");
  }

  const [validPosition, setValidPosition] = useState(false);
  async function handleSelectOutcome(e) {
    const [conditionId, outcomeIndex] = e.target.name.split(/[-\]]/g);
    setSelectedOutcomes({
      ...selectedOutcomes,
      [conditionId]: outcomeIndex
    });

    if (outcomeIndex === undefined) {
      removeAssumption(conditionId);
    }

    // update affected outcomes
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

    await updateMarkets();
    await updateOutcomeTokenCounts(invest || "0");
  }

  const [buyError, setBuyError] = useState("");
  async function handleSelectInvest(e) {
    const invest = e.target.value;
    const asNum = parseFloat(invest);

    const isEmpty = invest === "";
    const validNum = !isNaN(asNum) && isFinite(asNum) && asNum > 0;

    setInvest(invest);

    if (!isEmpty && validNum) {
      await Promise.all([
        updateOutcomeTokenCounts(invest || "0"),
        (async () => {
          const collateralDecimalDenominator = new Decimal(10).pow(
            collateral.decimals || 18
          );

          const investWei = new Decimal(invest).mul(
            collateralDecimalDenominator
          );
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
        })()
      ]);
    }
  }

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

      const newPrices = await loadMarginalPrices();
      setPrices(newPrices);
      const positionIds = await loadPositions();
      setPositionIds(positionIds);
      const balances = await loadBalances(positionIds);
      setBalances(balances);
      const newMarkets = await loadMarkets(newPrices);
      setMarkets(newMarkets);
      const positions = await generatePositionList(newMarkets, balances);
      setPositions(positions);

      await updateOutcomeTokenCounts(invest || "0");
    } catch (err) {
      setBuyError(err.message);
      throw err;
    } finally {
      setIsBuying(false);
    }
  }

  const [selectedSellAmount, setSelectedSellAmount] = useState("");
  const [predictedSellProfit, setPredictedSellProfit] = useState(null);
  async function updateSellProfit(positionOutcomeGrouping) {
    const asNum = parseFloat(selectedSellAmount);

    const isEmpty = selectedSellAmount === "";
    const validNum = !isNaN(asNum) && isFinite(asNum) && asNum > 0;
    if (isEmpty || !validNum) return;

    const targetPosition = positions.find(
      ({ outcomeIds }) => outcomeIds === positionOutcomeGrouping
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
  }

  const [selectedSell, setSelectedSell] = useState(null);
  async function handleSelectSell(positionOutcomeGrouping) {
    setSelectedSellAmount("");
    setPredictedSellProfit(null);
    setSelectedSell(
      positionOutcomeGrouping === selectedSell ? null : positionOutcomeGrouping
    );
    await updateSellProfit(positionOutcomeGrouping);
  }

  async function handleSelectSellAmount(e) {
    if (typeof e !== "string") {
      const asNum = parseFloat(e.target.value);
      const isEmpty = e.target.value === "";
      const validNum = !isNaN(asNum) && isFinite(asNum) && asNum > 0;

      setSelectedSellAmount(e.target.value);
      if (!isEmpty && validNum) {
        await updateSellProfit(selectedSell);
      }
    } else {
      setSelectedSellAmount(e);
      await updateSellProfit(selectedSell);
    }
  }

  async function handleSellPosition(atomicOutcomes, amount) {
    await sellOutcomes(atomicOutcomes, amount);
    const prices = await loadMarginalPrices();
    const updatedMarkets = await loadMarkets(prices);
    setMarkets(updatedMarkets);

    const positionIds = await loadPositions();
    setPositionIds(positionIds);

    const balances = await loadBalances(positionIds);
    setBalances(balances);

    const positions = await generatePositionList(updatedMarkets, balances);
    setPositions(positions);

    setSelectedSell(null);
    setSelectedSellAmount("");
    setPredictedSellProfit(null);
  }

  if (loading === "SUCCESS")
    return (
      <Page
        {...{
          markets,
          positions,
          collateral,
          assumptions,
          selectedOutcomes,

          predictionProbabilities,
          outcomeTokenBuyAmounts,
          stagedPositions,

          validPosition,
          allowanceAvailable,
          invest,
          buyError,
          isBuying,

          selectedSell,
          selectedSellAmount,
          predictedSellProfit,

          handleSelectAssumption,
          handleSelectOutcome,
          handleSelectInvest,

          handleSetAllowance,
          handleBuyOutcomes,

          handleSelectSell,
          handleSelectSellAmount,

          handleSellPosition
        }}
      />
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
