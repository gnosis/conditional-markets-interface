import React, { useState, useEffect } from "react";
import { hot } from "react-hot-loader";

import Page from "./Page";
import Spinner from "./Spinner";

import {
  loadMarkets,
  loadCollateral,
  loadMarginalPrices,
  loadProbabilitiesForPredictions

  // buyOutcomes,
  // sellOutcomes,
} from "../api/markets";
import {
  loadBalances,
  loadPositions,
  loadAllowance,
  generatePositionList,
  listOutcomePairsMatchingOutcomeId,
  calcOutcomeTokenCounts,
  sumPricePerShare
  // getCollateralBalance,
  // calcProfitForSale
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
    // mutating the state and rereturning the same ref
    // (original code this was based off of also mutated ref, but then made a copy)
    const conditionIndex = assumptions.indexOf(conditionIdToRemove);

    if (conditionIndex > -1) {
      assumptions.splice(conditionIndex, 1);
      setAssumptions(assumptions);
    }
    // no error will be thrown if condition is not found
    // because this may be called with an unassumed condition
    // (when user switches to "I don't know" from "Yes" or "No")
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

  const [, /*outcomeTokenBuyAmounts*/ setOutcomeTokenBuyAmounts] = useState([]);
  const [predictionProbabilities, setPredictionProbabilities] = useState([]);
  const [, /*stagedPositions*/ setStagedPositions] = useState([]);

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
    await setOutcomeTokenBuyAmounts(outcomeTokenCounts);

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
        assumptions.push(conditionId);
        setAssumptions(assumptions);
      } else {
        alert(
          "You can't make assumptions on all markets at once. You need to make at least one prediction."
        );
      }
    }

    await updateMarkets();
    await updateOutcomeTokenCounts(invest || "0");
  }

  const [, /*outcomesToBuy*/ setOutcomesToBuy] = useState([]);
  const [, /*validPosition*/ setValidPosition] = useState(false);
  const [, /*selectionPrice*/ setSelectionPrice] = useState(0);
  const [invest /*, setInvest*/] = useState(null);
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
    setOutcomesToBuy(outcomePairs);

    // sets if the selected position is valid (ie not all positions and not no positions)
    setValidPosition(
      outcomePairs.length > 0 && outcomePairs.length < totalOutcomeIndex + 1
    );

    // update the price for the selected outcomes the user would buy
    setSelectionPrice(await sumPricePerShare(outcomePairs));

    await updateMarkets();
    await updateOutcomeTokenCounts(invest || "0");
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

          handleSelectAssumption,
          handleSelectOutcome
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
