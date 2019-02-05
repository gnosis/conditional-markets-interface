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
  withState("invest", "setInvest"),
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
      assumptions: {},
      unlockedPredictions: false,
      selectedOutcomes: {}
    },
    {
      unlockPredictions: () => () => ({
        unlockedPredictions: true
      }),
      selectAssumption: ({ assumptions }) => (conditionId, value) => {
        if (value === "none") {
          const {
            [conditionId]: removed,
            ...filteredAssumptions
          } = assumptions;
          return {
            assumptions: filteredAssumptions
          };
        }

        return {
          assumptions: {
            ...assumptions,
            [conditionId]: value
          }
        };
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
    handleSelectAssumption: ({ selectAssumption }) => e => {
      const [i, conditionId, k] = e.target.name.split(/[\[\]]/g);
      //console.log(conditionId)
      selectAssumption(conditionId, e.target.value);
    },
    handleSelectInvest: ({ setInvest }) => e => {
      const asNum = parseInt(e.target.value, 10);

      const isEmpty = e.target.value === "";
      const validNum = !isNaN(asNum) && isFinite(asNum) && asNum > 0;

      if (validNum) {
        setInvest(asNum);
      } else if (isEmpty) {
        setInvest("");
      }
    },
    handleBuyOutcomes: ({
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
