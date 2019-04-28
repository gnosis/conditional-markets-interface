import React, { useState, useEffect } from "react";
import { hot } from "react-hot-loader";

import Page from "./Page";
import Spinner from "./Spinner";

import {
  loadMarginalPrices,
  loadMarkets,
  // loadProbabilitiesForPredictions,
  // buyOutcomes,
  // sellOutcomes,
  loadCollateral
} from "../api/markets";
import {
  loadBalances,
  loadPositions,
  loadAllowance,
  generatePositionList
  // sumPricePerShare,
  // listOutcomePairsMatchingOutcomeId,
  // calcOutcomeTokenCounts,
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

  const [assumptions /*, setAssumptions*/] = useState([]);
  const [selectedOutcomes /*, setSelectedOutcomes*/] = useState({});

  const [predictionProbabilities /*, setPredictionProbabilities*/] = useState(
    []
  );

  if (loading === "SUCCESS")
    return (
      <Page
        {...{
          markets,
          positions,
          collateral,
          assumptions,
          selectedOutcomes,
          predictionProbabilities
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
