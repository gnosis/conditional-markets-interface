import React, { useEffect, useCallback, useState } from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";
import Web3 from "web3";

const { toBN } = Web3.utils;

import Spinner from "components/Spinner";

import { formatCollateral } from "utils/formatting";
import { getPositionId, combineCollectionIds } from "utils/getIdsUtil";

import getConditionalTokensRepo from "repositories/ConditionalTokensRepo";
let conditionalTokensRepo;

import style from "../Sell/positions.scss";

const cx = cn.bind(style);

const Redeem = ({
  markets,
  account,
  positionBalances,
  marketResolutionStates,
  positions,
  collateral,
  ongoingTransactionType,
  asWrappedTransaction,
  error,
  setError
}) => {
  // Memoize fetching data files
  const loadDataLayer = useCallback(() => {
    async function getRepo() {
      conditionalTokensRepo = await getConditionalTokensRepo();
    }
    getRepo();
  }, []);

  // Load data layer just on page load
  useEffect(() => {
    loadDataLayer();
  }, []);

  const [redemptionAmount, setRedemptionAmount] = useState(null);

  const allMarketsResolved =
    marketResolutionStates &&
    marketResolutionStates.every(({ isResolved }) => isResolved);

  useEffect(() => {
    setRedemptionAmount(
      allMarketsResolved && positionBalances != null
        ? positionBalances.reduce(
            (payoutSum, balance, positionIndex) =>
              payoutSum.add(
                positions[positionIndex].outcomes.reduce(
                  (payoutProduct, { marketIndex, outcomeIndex }) =>
                    payoutProduct
                      .mul(
                        marketResolutionStates[marketIndex].payoutNumerators[
                          outcomeIndex
                        ]
                      )
                      .div(
                        marketResolutionStates[marketIndex].payoutDenominator
                      ),
                  balance
                )
              ),
            toBN(0)
          )
        : null
    );
  }, [positions, positionBalances, marketResolutionStates]);

  const redeemPositions = useCallback(async () => {
    if (!allMarketsResolved)
      throw new Error("Can't redeem until all markets resolved");

    async function redeemPositionsThroughAllMarkets(
      marketsLeft,
      parentCollectionId
    ) {
      if (marketsLeft === 0) return;

      const market = markets[marketsLeft - 1];
      const indexSets = [];

      for (
        let outcomeIndex = 0;
        outcomeIndex < market.outcomes.length;
        outcomeIndex++
      ) {
        const outcome = market.outcomes[outcomeIndex];
        const childCollectionId = combineCollectionIds([
          parentCollectionId,
          outcome.collectionId
        ]);

        const childPositionId = getPositionId(
          collateral.address,
          childCollectionId
        );

        await redeemPositionsThroughAllMarkets(
          marketsLeft - 1,
          childCollectionId
        );

        if (
          (await conditionalTokensRepo.balanceOf(account, childPositionId)).gtn(
            0
          )
        ) {
          indexSets.push(toBN(1).shln(outcomeIndex));
        }
      }

      if (indexSets.length > 0) {
        await conditionalTokensRepo.redeemPositions(
          collateral.address,
          parentCollectionId,
          market.conditionId,
          indexSets,
          account
        );
      }
    }

    await redeemPositionsThroughAllMarkets(
      markets.length,
      `0x${"0".repeat(64)}`
    );
  }, [collateral, account, conditionalTokensRepo, allMarketsResolved]);

  if (!redemptionAmount) {
    return null;
  }

  return (
    <div className={cx("positions", { resolved: allMarketsResolved })}>
      {redemptionAmount.toString() != "0" && (
        <div className={cx("positions-subheading")}>
          Redeeming your positions will net you a total of{" "}
          {formatCollateral(redemptionAmount, collateral)}
        </div>
      )}
      <div className={cx("positions-redeem")}>
        <button
          type="button"
          className={cx("redeem-all")}
          disabled={
            ongoingTransactionType != null || redemptionAmount.toString() == "0"
          }
          onClick={asWrappedTransaction(
            "redeem positions",
            redeemPositions,
            setError
          )}
        >
          {ongoingTransactionType === "redeem positions" ? (
            <Spinner inverted width={25} height={25} />
          ) : (
            <>Redeem Positions</>
          )}
        </button>
      </div>
      {error != null && <span className={cx("error")}>{error.message}</span>}
    </div>
  );
};

Redeem.propTypes = {
  account: PropTypes.string.isRequired,
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
  ).isRequired
};

export default Redeem;
