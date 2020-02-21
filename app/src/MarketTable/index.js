import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
// import Web3 from "web3";
import cn from "classnames/bind";
import Decimal from "decimal.js-light";

import style from "./marketTable.scss";

import useGlobalState from "hooks/useGlobalState";

import MarketRow from "./MarketRow";
import Spinner from "components/Spinner";

import {
  getMarketProbabilities,
  getStagedMarketProbabilities
} from "utils/probabilities";

// const { BN } = Web3.utils;

const cx = cn.bind(style);

const MarketTable = ({
  markets,
  positions,
  marketSelections,
  setMarketSelections,
  resetMarketSelections,
  stagedTradeAmounts,
  tradeHistory
}) => {
  useEffect(() => {
    resetMarketSelections();
    return () => {
      setMarketSelections(null);
      setMarketProbabilities(null);
    };
  }, []);

  const {
    lmsrState,
    marketProbabilities,
    setMarketProbabilities
  } = useGlobalState();

  const [stagedMarketProbabilities, setStagedMarketProbabilities] = useState(
    null
  );

  useEffect(() => {
    if (
      lmsrState !== null &&
      lmsrState.positionBalances.length === positions.length &&
      marketSelections
    ) {
      const { funding, positionBalances } = lmsrState;
      const {
        invB,
        positionProbabilities,
        newMarketProbabilities
      } = getMarketProbabilities(
        funding,
        positionBalances,
        markets,
        positions,
        marketSelections
      );
      setMarketProbabilities(newMarketProbabilities);

      if (stagedTradeAmounts != null) {
        const marketProbabilitiesAfterStagedTrade = getStagedMarketProbabilities(
          {
            positionProbabilities,
            invB,
            stagedTradeAmounts,
            markets,
            positions,
            marketSelections
          }
        );
        setStagedMarketProbabilities(marketProbabilitiesAfterStagedTrade);
      } else {
        setStagedMarketProbabilities(null);
      }
    }
  }, [lmsrState, markets, positions, marketSelections, stagedTradeAmounts]);

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

  if (!lmsrState || !marketProbabilities) {
    return <Spinner />;
  }

  return (
    <div className={cx("market-table")}>
      {conditionalMarkets.map(market => (
        <MarketRow
          key={market.conditionId}
          tradeHistory={tradeHistory}
          probabilities={marketProbabilities[market.index]}
          stagedProbabilities={
            stagedMarketProbabilities != null
              ? stagedMarketProbabilities[market.index]
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
          probabilities={
            marketProbabilities !== null
              ? marketProbabilities[market.index]
              : null
          }
          stagedProbabilities={
            stagedMarketProbabilities != null
              ? stagedMarketProbabilities[market.index]
              : null
          }
          tradeHistory={tradeHistory}
          {...market}
        />
      ))}
    </div>
  );
};

MarketTable.propTypes = {
  markets: PropTypes.arrayOf(
    PropTypes.shape({
      conditionId: PropTypes.string.isRequired
    }).isRequired
  ).isRequired,
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
  // lmsrState: PropTypes.shape({
  //   funding: PropTypes.instanceOf(BN).isRequired,
  //   positionBalances: PropTypes.arrayOf(PropTypes.instanceOf(BN).isRequired)
  //     .isRequired
  // }),
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
