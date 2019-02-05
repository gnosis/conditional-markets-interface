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

import { loadMarkets, buyOutcomes } from "api/markets";

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
  withState("invest", "setInvest"),
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
  lifecycle({
    async componentDidMount() {
      const { setLoading, setMarkets } = this.props;

      setLoading(LOADING_STATES.LOADING);

      try {
        const markets = await loadMarkets();
        //console.log(markets)
        setMarkets(markets);

        setLoading(LOADING_STATES.SUCCESS);
      } catch (err) {
        setLoading(LOADING_STATES.FAILURE);
        console.error(err.message);
        console.error(err.stack);
      }
    }
  }),
  withHandlers({
    handleUpdateMarkets: ({ assumptions, setMarkets }) => async () => {
      console.log(assumptions)
      const marketsWithAssumptions = await loadMarkets(assumptions)
      setMarkets(marketsWithAssumptions);
    },
  }),
  withHandlers({
    handleSelectAssumption: ({ selectAssumption, handleUpdateMarkets }) => async (e) => {
      const [i, conditionId, k] = e.target.name.split(/[\[\]]/g);
      //console.log(conditionId)
      await selectAssumption(conditionId, e.target.value);

      return handleUpdateMarkets()
    },
    handleSelectInvest: ({ setInvest }) => e => {
      const asNum = parseInt(e.target.value, 10);
      const validNum = !isNaN(asNum) && isFinite(asNum) && asNum > 0;

      if (validNum) {
        setInvest(asNum);
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
    }
  }),
  loadingHandler
);

export default enhancer(Page);
