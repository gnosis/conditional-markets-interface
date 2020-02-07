import React, { useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import cn from "classnames/bind";
import Decimal from "decimal.js-light";

import style from "./marketTable.scss";

import MarketRow from "./MarketRow";
import Spinner from "components/Spinner";
import HelpButton from "components/HelpButton";

import {
  getMarketProbabilities,
  getStagedMarketProbabilities
} from "utils/probabilities";

const { BN } = Web3.utils;

const cx = cn.bind(style);

const MarketTable = ({
  markets,
  collateral,
  positions,
  lmsrState,
  marketSelections,
  setMarketSelections,
  resetMarketSelections,
  stagedTradeAmounts,
  openModal,
  tradeHistory
}) => {
  useEffect(() => {
    resetMarketSelections();
    // FIXME This breaks when reloading component after market maker address update
    // return () => {
    //   setMarketSelections(null);
    // };
  }, [markets]);

  const [marketProbabilities, setMarketProbabilities] = useState(null);
  const [
    marketProbabilitiesAfterStagedTrade,
    setMarketProbabilitiesAfterStagedTrade
  ] = useState(null);
  useMemo(() => {
    if (lmsrState != null) {
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
        setMarketProbabilitiesAfterStagedTrade(
          marketProbabilitiesAfterStagedTrade
        );
      } else {
        setMarketProbabilitiesAfterStagedTrade(null);
      }
    }
  }, [lmsrState, markets, positions, marketSelections, stagedTradeAmounts]);

  const conditionalDisabled = markets.length === 1;

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

  const headings = [
    "#",
    "Market",
    "Implied probability",
    "Ends In",
    !conditionalDisabled && (
      <>
        <span>Conditional</span> <HelpButton openModal={openModal} />
      </>
    )
  ];

  if (!lmsrState) {
    return <Spinner />;
  }

  return (
    <div className={cx("market-table")}>
      {conditionalMarkets.map(market => (
        <MarketRow
          key={market.conditionId}
          lmsrState={lmsrState}
          headings={headings}
          tradeHistory={tradeHistory}
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
          lmsrState={lmsrState}
          collateral={collateral}
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
          tradeHistory={tradeHistory}
          disableConditional={conditionalDisabled}
          marketSelections={marketSelections}
          setMarketSelection={setMarketSelections}
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
  ),
  openModal: PropTypes.func.isRequired
};

export default MarketTable;
