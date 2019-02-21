import React from "react";
import Page from "components/Page";
import { findIndex } from "lodash";
import {
  renderComponent,
  compose,
  lifecycle,
  branch,
  withState,
  withStateHandlers,
  withHandlers
} from "recompose";

import { loadMarginalPrices, loadMarkets, buyOutcomes, sellOutcomes } from "api/markets";
import { loadBalances, loadPositions, generatePositionList, listAffectedOutcomesForIds, listOutcomeIdsForIndexes } from "api/balances";

export const LOADING_STATES = {
  UNKNOWN: "UNKNOWN",
  LOADING: "LOADING",
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE"
};

const marketLoadingFailure = () => <p>Failed to load</p>;
const marketLoading = () => <p>Loading...</p>;

const loadingHandler = branch(
  ({ loading }) => loading !== "SUCCESS",
  branch(
    ({ loading }) => loading === "FAILURE",
    renderComponent(marketLoadingFailure),
    renderComponent(marketLoading)
  )
);

const enhancer = compose(
  withState("loading", "setLoading", LOADING_STATES.UNKNOWN),
  withState("markets", "setMarkets", {}),
  withState("sellAmounts", "setSellAmounts", {}),
  withState("invest", "setInvest"),
  withState("prices", "setPrices", {}),
  withState("balances", "setBalances", {}),
  withState("positionIds", "setPositionIds", {}),
  withState("positions", "setPositions", {}),
  withState("outcomesToBuy", "setOutcomesToBuy", []),
  lifecycle({
    async componentDidMount() {
      const { setLoading, setMarkets, setPrices, setPositionIds, setPositions, setBalances } = this.props;
      setLoading(LOADING_STATES.LOADING);

      try {
        const prices = await loadMarginalPrices();
        await setPrices(prices);
        const markets = await loadMarkets(prices);
        await setMarkets(markets);
        const positionIds = await loadPositions();
        await setPositionIds(positionIds);
        const balances = await loadBalances(positionIds);
        await setBalances(balances)
        const positions = await generatePositionList(balances)
        await setPositions(positions)

        
        setLoading(LOADING_STATES.SUCCESS);
      } catch (err) {
        setLoading(LOADING_STATES.FAILURE);
        console.error(err.message);
        console.error(err.stack);
      }
    }
  }),
  withStateHandlers(
    {
      assumptions: [],
      unlockedPredictions: false,
      selectedOutcomes: {},
      targetPairs: [],
    },
    {
      unlockPredictions: () => () => ({
        unlockedPredictions: true
      }),
      removeAssumption: ({ assumptions }) => conditionIdToRemove => {
        const conditionIndex = assumptions.indexOf(conditionIdToRemove);

        if (conditionIndex > -1) {
          assumptions.splice(conditionIndex, 1);
        }

        return { assumptions: [...assumptions] };
      },
      addAssumption: ({ assumptions }) => conditionId => {
        if (!assumptions.includes(conditionId)) {
          return {
            assumptions: [...assumptions, conditionId]
          };
        }

        return { assumptions };
      },
      selectOutcomes: ({ selectedOutcomes }) => (
        conditionId,
        outcomeIndex
      ) => ({
        selectedOutcomes: {
          ...selectedOutcomes,
          [conditionId]: outcomeIndex
        }
      })
    }
  ),
  withHandlers({
    handleUpdateMarkets: ({ prices, assumptions, markets, selectedOutcomes, setMarkets }) => async () => {
      const assumedOutcomeIndexes = []

      Object.keys(selectedOutcomes).forEach((targetConditionId) => {
        if (assumptions.includes(targetConditionId)) {
          const marketIndex = findIndex(markets, ({ conditionId }) => conditionId == targetConditionId)
          let lmsrOutcomeIndex = 0
          for (let i = 0; i < marketIndex; i++) lmsrOutcomeIndex += markets[marketIndex].outcomes.length
  
          const selectedOutcome = parseInt(selectedOutcomes[targetConditionId], 10)
          assumedOutcomeIndexes.push(lmsrOutcomeIndex + selectedOutcome)
        }
      })
      const marketsWithAssumptions = await loadMarkets(prices, assumedOutcomeIndexes);
      setMarkets(marketsWithAssumptions);
    },
    handleUpdateAffectedOutcomes: ({ markets, setOutcomesToBuy, selectedOutcomes, assumptions }) => async () => {
      const outcomeIndexes = []
      
      // transform selectedOutcomes into outcomeIndex array, filtering all assumptions
      let totalOutcomeIndex = 0;
      markets.forEach(market => {
        if (
          selectedOutcomes[market.conditionId] != null &&
          !assumptions.includes(market.conditionId)
        ) {
          const selectedOutcome = parseInt(selectedOutcomes[market.conditionId], 10);
          outcomeIndexes.push(totalOutcomeIndex + selectedOutcome);
        }

        totalOutcomeIndex += market.outcomes.length;
      });
      
      const outcomePairs = await listOutcomeIdsForIndexes(outcomeIndexes)
      await setOutcomesToBuy(outcomePairs)
    }
  }),
  withHandlers({
    handleSelectAssumption: ({
      markets,
      assumptions,
      removeAssumption,
      addAssumption,
      handleUpdateMarkets
    }) => async conditionId => {
      if (assumptions.includes(conditionId)) {
        await removeAssumption(conditionId);
      } else {
        if (assumptions.length < markets.length - 1) {
          await addAssumption(conditionId);
        } else {
          alert(
            "You can't make assumptions on all markets at once. You need to make atleast one prediction."
          );
        }
      }

      return handleUpdateMarkets()
    },
    handleSelectOutcome: ({ assumptions, removeAssumption, selectOutcomes, handleUpdateMarkets, handleUpdateAffectedOutcomes }) => async e => {
      const [conditionId, outcomeIndex] = e.target.name.split(/[\-\]]/g);
      await selectOutcomes(conditionId, outcomeIndex);

      if (outcomeIndex === undefined && assumptions.includes(conditionId)) {
        await removeAssumption(conditionId)
      }

      await handleUpdateAffectedOutcomes();
      await handleUpdateMarkets();
    },
    handleSelectInvest: ({ setInvest }) => e => {
      const asNum = parseInt(e.target.value, 10);

      const isEmpty = e.target.value === "";
      const validNum = !isNaN(asNum) && isFinite(asNum) && asNum > 0;

      if (validNum) {
        setInvest(asNum);
      } else if (isEmpty) {
        setInvest();
      }
    },
    handleBuyOutcomes: ({
      markets,
      setMarkets,
      setPrices,
      setPositionIds,
      setPositions,
      setBalances,
      invest,
      assumptions,
      selectedOutcomes
    }) => async () => {
      const outcomeIndexes = []
      
      // transform selectedOutcomes into outcomeIndex array, filtering all assumptions
      let totalOutcomeIndex = 0;
      markets.forEach(market => {
        if (
          selectedOutcomes[market.conditionId] != null &&
          !assumptions.includes(market.conditionId)
        ) {
          const selectedOutcome = parseInt(selectedOutcomes[market.conditionId], 10);
          outcomeIndexes.push(totalOutcomeIndex + selectedOutcome);
        }

        totalOutcomeIndex += market.outcomes.length;
      });
      
      await buyOutcomes(outcomeIndexes, invest);

      const newPrices = await loadMarginalPrices();
      await setPrices(newPrices);
      const positionIds = await loadPositions();
      await setPositionIds(positionIds);
      const balances = await loadBalances(positionIds);
      await setBalances(balances)
      const newMarkets = await loadMarkets(newPrices);
      await setMarkets(newMarkets);
      const positions = await generatePositionList(balances)
      await setPositions(positions)
    },
    handleSellOutcomes: ({
      markets,
      setMarkets,
      invest,
      selectedOutcomes
    }) => async () => {
      const outcomeIndexes = [];

      Object.keys(selectedOutcomes).forEach(conditionId => {
        const market = find(markets, { conditionId });

        if (!market) throw new Error("Market not found, wtf?");
        const marketOutcomeIndex = selectedOutcomes[conditionId];

        outcomeIndexes.push(
          market.outcomes[marketOutcomeIndex].lmsrOutcomeIndex
        );
      });
      console.log(
        "handleSellOutcomes -> outcomeIndexes: ",
        JSON.stringify(outcomeIndexes, null, 2)
      );
      await sellOutcomes(outcomeIndexes, invest);
      const updatedMarkets = await loadMarkets();
      //console.log(markets)
      setMarkets(updatedMarkets);
    },
    handleSellOutcome: ({
      setMarkets,
      sellAmounts,
      setSellAmounts
    }) => async lmsrOutcomeIndex => {
      const sellAmount = sellAmounts[lmsrOutcomeIndex];
      await sellOutcomes([lmsrOutcomeIndex], sellAmount);
      const updatedMarkets = await loadMarkets();
      //console.log(markets)
      setMarkets(updatedMarkets);
      setSellAmounts(prev => ({
        ...prev,
        [lmsrOutcomeIndex]: ""
      }));
    },
    handleSelectSell: ({ setSellAmounts }) => (e, outcome) => {
      const { value } = e.target;

      const asNum = parseInt(value, 10);
      const isEmpty = value === "";
      const validNum = !isNaN(asNum) && isFinite(asNum) && asNum > 0;
      const valueGtCurrentBalance = asNum > outcome.balance;

      if (isEmpty || (validNum && !valueGtCurrentBalance)) {
        setSellAmounts(sellAmounts => ({
          ...sellAmounts,
          [outcome.lmsrOutcomeIndex]: value
        }));
      }
    },
  }),
  loadingHandler
);

export default enhancer(Page);
