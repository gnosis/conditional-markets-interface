import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import cn from "classnames/bind";
import Decimal from "decimal.js-light";
import { Query } from "react-apollo";
import gql from "graphql-tag";

import Markdown from "react-markdown";

import style from "./marketTable.scss";
import ResolutionTime from "./ResolutionTime";
import Spinner from "components/Spinner";

import { markdownRenderers } from "utils/markdown";
import { calcSelectedMarketProbabilitiesFromPositionProbabilities } from "utils/probabilities";
import Graph from "./Graph";

import prepareQueryData from "./utils/prepareQueryData";

import { ApolloProvider } from "react-apollo";
import { ApolloClient } from "apollo-client";
import { createHttpLink } from "apollo-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";

// 2
const httpLink = createHttpLink({
  uri: "https://api.thegraph.com/subgraphs/name/gnosis/sight"
});

// 3
const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache()
});

const MARKET_MAKER_QUERY = gql`
  {
    outcomeTokenTrades {
      id
      count
      transactor
      outcomeTokenAmounts
      outcomeTokenNetCost
      marketFees
      outcomeSlotCount
      marketMakerMarginalPrices
      blockTimestamp
      blockNumber
      marketMaker
      marketMakerOwner
    }
    marketMakers {
      id
      creator
      marketMaker
      pmSystem
      collateralToken
      conditionIds
      fee
      funding
    }
  }
`;

const { BN } = Web3.utils;

const cx = cn.bind(style);

const MarketTable = ({
  markets,
  positions,
  lmsrState,
  marketSelections,
  setMarketSelections,
  resetMarketSelections
}) => {
  useEffect(() => {
    resetMarketSelections();
    return () => {
      setMarketSelections(null);
    };
  }, []);
  const [isExpanded, setExpanded] = useState(false);
  const handleToggleExpand = useCallback(() => {
    setExpanded(!isExpanded);
  }, [isExpanded]);

  let marketProbabilities = null;

  if (lmsrState != null) {
    const { funding, positionBalances } = lmsrState;
    const invB = new Decimal(positionBalances.length)
      .ln()
      .div(funding.toString());

    const positionProbabilities = positionBalances.map(balance =>
      invB
        .mul(balance.toString())
        .neg()
        .exp()
    );
    marketProbabilities = calcSelectedMarketProbabilitiesFromPositionProbabilities(
      markets,
      positions,
      marketSelections,
      positionProbabilities
    );
  }

  if (!lmsrState) {
    return <Spinner />;
  }

  return (
    <div className={cx("markettable")}>
      <Query query={MARKET_MAKER_QUERY}>
        {({ loading, error, data }) => {
          if (loading) return <Spinner width={32} height={32} />;
          if (error) throw new Error(error);

          return prepareQueryData(markets, data, lmsrState).map(
            (
              {
                conditionId,
                title,
                resolutionDate,
                dataSource,
                dataSourceUrl,
                lowerBound,
                upperBound,
                decimals,
                unit,
                description,
                trades
              },
              index
            ) => {
              return (
                <div
                  className={cx("markettable-row")}
                  key={`market-${conditionId}`}
                >
                  <div className={cx("header")}>{title}</div>
                  <div className={cx("subheader")}>
                    <div className={cx("property")}>
                      <i className={cx("icon", "icon-time")} />{" "}
                      <ResolutionTime date={resolutionDate} />
                    </div>
                    <div className={cx("property")}>
                      <i className={cx("icon", "icon-oracle")} /> Oracle Name
                    </div>
                    <div className={cx("property")}>
                      <i className={cx("icon", "icon-volume")} />{" "}
                      {lmsrState.funding.toString()} DAI
                    </div>
                  </div>
                  <div className={cx("prediction")}>
                    <ApolloProvider client={client}>
                      <Graph
                        lowerBound={lowerBound}
                        upperBound={upperBound}
                        decimals={decimals}
                        unit={unit}
                        entries={trades}
                        queryData={data}
                        currentProbability={marketProbabilities[index][0]}
                      />
                    </ApolloProvider>
                  </div>
                  <div className={cx("details")}>
                    <div className={cx("details-header")}>
                      <button
                        type="button"
                        className={cx("details-expand")}
                        onClick={handleToggleExpand}
                      >
                        Market Details
                        <span className={cx("expand-button")}>
                          {isExpanded ? "–" : "+"}
                        </span>
                      </button>
                    </div>
                    <div
                      className={cx("details-content", {
                        hidden: !isExpanded
                      })}
                    >
                      {dataSource && (
                        <>
                          <h1>Data Source</h1>
                          {dataSourceUrl ? (
                            <a
                              href={dataSourceUrl}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              {dataSource}
                            </a>
                          ) : (
                            <>{dataSource}</>
                          )}
                        </>
                      )}
                      <Markdown
                        className={cx("description")}
                        source={
                          description || "*No Description for this Market*"
                        }
                        renderers={markdownRenderers}
                      />
                    </div>
                  </div>
                </div>
              );
            }
          );
        }}
      </Query>
    </div>
  );
};

MarketTable.propTypes = {
  markets: PropTypes.arrayOf(
    PropTypes.shape({
      conditionId: PropTypes.string.isRequired
    }).isRequired
  ).isRequired,
  marketResolutionStates: PropTypes.array,
  positions: PropTypes.arrayOf(
    PropTypes.shape({
      positionIndex: PropTypes.number.isRequired,
      outcomes: PropTypes.arrayOf(
        PropTypes.shape({
          marketIndex: PropTypes.number.isRequired,
          outcomeIndex: PropTypes.number.isRequired
        }).isRequired
      ).isRequired
    }).isRequired
  ).isRequired,
  lmsrState: PropTypes.shape({
    funding: PropTypes.instanceOf(BN).isRequired,
    positionBalances: PropTypes.arrayOf(PropTypes.instanceOf(BN).isRequired)
      .isRequired
  }),
  marketSelections: PropTypes.arrayOf(
    PropTypes.shape({
      selectedOutcomeIndex: PropTypes.number,
      isAssumed: PropTypes.bool.isRequired
    }).isRequired
  ),
  resetMarketSelections: PropTypes.func.isRequired,
  setMarketSelections: PropTypes.func.isRequired,
  stagedTradeAmounts: PropTypes.arrayOf(
    PropTypes.instanceOf(Decimal).isRequired
  )
};

export default MarketTable;
