import React, { useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import cn from "classnames/bind";
import Decimal from "decimal.js-light";

import style from "./marketTable.scss";

import MarketRow from "./MarketRow";
import HelpButton from "components/HelpButton";

import { oneDecimal } from "utils/constants";
import { calcSelectedMarketProbabilitiesFromPositionProbabilities } from "utils/probabilities";

const { BN } = Web3.utils;

const cx = cn.bind(style);

const MarketTable = ({
  markets,
  marketResolutionStates,
  positions,
  lmsrState,
  marketSelections,
  setMarketSelections,
  stagedTradeAmounts
}) => {
  useEffect(() => {
    setMarketSelections(
      Array.from({ length: markets.length }, () => ({
        selectedOutcomeIndex: -1, // no selection
        isAssumed: false
      }))
    );
    return () => {
      setMarketSelections(null);
    };
  }, []);

  let marketProbabilities = null;
  let marketProbabilitiesAfterStagedTrade = null;
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

    if (stagedTradeAmounts != null) {
      const unnormalizedPositionProbabilitiesAfterStagedTrade = positionProbabilities.map(
        (probability, i) =>
          probability.mul(stagedTradeAmounts[i].mul(invB).exp())
      );
      const normalizer = oneDecimal.div(
        unnormalizedPositionProbabilitiesAfterStagedTrade.reduce((a, b) =>
          a.add(b)
        )
      );
      const positionProbabilitiesAfterStagedTrade = unnormalizedPositionProbabilitiesAfterStagedTrade.map(
        probability => probability.mul(normalizer)
      );

      marketProbabilitiesAfterStagedTrade = calcSelectedMarketProbabilitiesFromPositionProbabilities(
        markets,
        positions,
        marketSelections,
        positionProbabilitiesAfterStagedTrade
      );
    }
  }

  let isStaging = false;

  (marketSelections || []).forEach(({ selectedOutcomeIndex }) => {
    if (selectedOutcomeIndex > -1) {
      isStaging = true;
    }
  });

  const conditionalMarketIndices = (marketSelections || []).reduce(
    (acc, { isAssumed }, index) => (isAssumed ? [...acc, index] : acc),
    []
  );

  const marketsWithSetIndices = markets.map((market, index) => ({
    ...market,
    index
  }));

  const conditionalMarkets = [];
  const nonConditionalMarkets = [];

  marketsWithSetIndices.forEach(market => {
    if (
      conditionalMarketIndices.indexOf(marketsWithSetIndices.indexOf(market)) >
      -1
    ) {
      conditionalMarkets.push(market);
    } else {
      nonConditionalMarkets.push(market);
    }
  });

  return (
    <table className={cx("market-table")}>
      <thead>
        <tr>
          <th>#</th>
          <th>Market</th>
          <th>Outcome Probability {isStaging && <em>(Predicted)</em>}</th>
          <th>Ends In</th>
          <th>Outcome</th>
          <th>
            <span>Conditional</span>
            <HelpButton />
          </th>
        </tr>
      </thead>
      <tbody>
        {conditionalMarkets.map(market => (
          <MarketRow
            key={market.conditionId}
            stagedProbabilities={
              marketProbabilities != null
                ? marketProbabilities[market.index]
                : null
            }
            probabilities={
              marketProbabilitiesAfterStagedTrade != null
                ? marketProbabilitiesAfterStagedTrade[market.index]
                : null
            }
            marketSelections={marketSelections}
            setMarketSelection={setMarketSelections}
            {...market}
          />
        ))}
        {conditionalMarkets.length > 0 && (
          <>
            <tr className={cx("explanation-row")}>
              <td
                colSpan={6}
                className={cx("explanation", "explanation-top", "arrow")}
              >
                <span>If</span>
              </td>
            </tr>
            <tr className={cx("explanation-row")}>
              <td
                colSpan={6}
                className={cx("explanation", "explanation-down", "arrow")}
              >
                <span>Then</span>
              </td>
            </tr>
          </>
        )}
        {nonConditionalMarkets.map(market => (
          <MarketRow
            key={market.conditionId}
            stagedProbabilities={
              marketProbabilities != null
                ? marketProbabilities[market.index]
                : null
            }
            probabilities={
              marketProbabilitiesAfterStagedTrade != null
                ? marketProbabilitiesAfterStagedTrade[market.index]
                : null
            }
            marketSelections={marketSelections}
            setMarketSelection={setMarketSelections}
            {...market}
          />
        ))}
      </tbody>
    </table>
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
  setMarketSelections: PropTypes.func.isRequired,
  stagedTradeAmounts: PropTypes.arrayOf(
    PropTypes.instanceOf(Decimal).isRequired
  )
};

export default MarketTable;
