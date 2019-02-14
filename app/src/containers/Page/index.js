import React from "react";
import Page from "components/Page";
import { find } from "lodash";
import {
  renderComponent,
  compose,
  lifecycle,
  branch,
  withState,
  withStateHandlers,
  withHandlers
} from "recompose";

import { loadMarkets, buyOutcomes, sellOutcomes } from "api/markets";

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
  lifecycle({
    async componentDidMount() {
      const { setLoading, setMarkets } = this.props;

      setLoading(LOADING_STATES.LOADING);

      try {
        const markets = await loadMarkets();
        //console.log(markets)
        console.log(markets);
        setMarkets(markets);

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
      investments: {},
    },
    {
      unlockPredictions: () => () => ({
        unlockedPredictions: true
      }),
      removeAssumption: ({ assumptions }) => (conditionIdToRemove) => {
        const conditionIndex = assumptions.indexOf(conditionIdToRemove)
        
        if (conditionIndex > -1) {
          assumptions.splice(conditionIndex, 1)
        }

        return { assumptions: [...assumptions] }
      },
      setInvest: ({ investments }) => (conditionId, amount) => {
        return {
          investments: {
            ...investments,
            [conditionId]: amount
          }
        }
      },
      addAssumption: ({ assumptions }) => (conditionId) => {
        if (!assumptions.includes(conditionId)) {
          return {
            assumptions: [...assumptions, conditionId ]
          }
        }

        return { assumptions }
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
    handleUpdateMarkets: ({ assumptions, setMarkets }) => async () => {
      console.log(assumptions)
      const marketsWithAssumptions = await loadMarkets(assumptions)
      setMarkets(marketsWithAssumptions);
    },
  }),
  withHandlers({
    handleSelectAssumption: ({ assumptions, removeAssumption, addAssumption, handleUpdateMarkets }) => async (conditionId) => {
      console.log(assumptions)
      if (assumptions.includes(conditionId)) {
        await removeAssumption(conditionId)
      } else {
        await addAssumption(conditionId)
      }
      
      //return handleUpdateMarkets()
    },
    handleSelectOutcome: ({ selectOutcomes }) => async (e) => {
      const [conditionId, outcomeIndex] = e.target.name.split(/[\-\]]/g);
      await selectOutcomes(conditionId, outcomeIndex);
    },
    handleSelectInvest: ({ setInvest }) => (conditionId, e) => {
      const asNum = parseInt(e.target.value, 10);

      const isEmpty = e.target.value === "";
      const validNum = !isNaN(asNum) && isFinite(asNum) && asNum > 0;

      if (validNum) {
        setInvest(conditionId, asNum);
      } else if (isEmpty) {
        setInvest(conditionId);
      }
    },
    handleBuyOutcomes: ({
      markets,
      setMarkets,
      investments,
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
      console.log(JSON.stringify(outcomeIndexes, null, 2));
      await buyOutcomes(outcomeIndexes, invest);
      const updatedMarkets = await loadMarkets();
      //console.log(markets)
      setMarkets(updatedMarkets);
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
    }
  }),
  loadingHandler
);

export default enhancer(Page);
