import React, { useEffect } from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import cn from "classnames/bind";
import Decimal from "decimal.js-light";

import style from "./marketTable.scss";
import ResolutionTime from "./ResolutionTime";
import Spinner from "components/Spinner";

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
  resetMarketSelections,
  stagedTradeAmounts
}) => {
  useEffect(() => {
    resetMarketSelections();
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

  if (!lmsrState) {
    return <Spinner />;
  }

  return (
    <div className={cx("markettable")}>
      {markets.map(({ conditionId, title, resolutionDate }, index) => (
        <div className={cx("markettable-row")} key={`market-${conditionId}`}>
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
            {marketProbabilities[0][0].toFixed(2)}%
          </div>
          <div className={cx("details")}>
            <div className={cx("details-header")}>
              Market Details
              <button type="button" className={cx("details-expand")}>
                +
              </button>
            </div>
            <div className={cx("details-content")}>Bleh</div>
          </div>
        </div>
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
