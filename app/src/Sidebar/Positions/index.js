import React, { Fragment, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import Decimal from "decimal.js-light";
import Spinner from "components/Spinner";
import { zeroDecimal } from "utils/constants";
import { formatCollateral } from "utils/formatting";
import { calcPositionGroups } from "utils/position-groups";

import cn from "classnames/bind";
import style from "./positions.scss";
import OutcomeCard from "../../components/OutcomeCard";

const cx = cn.bind(style);
const { toBN } = Web3.utils;

function calcNetCost({ funding, positionBalances }, tradeAmounts) {
  const invB = new Decimal(positionBalances.length)
    .ln()
    .dividedBy(funding.toString());
  return tradeAmounts
    .reduce(
      (acc, tradeAmount, i) =>
        acc.add(
          tradeAmount
            .sub(positionBalances[i].toString())
            .mul(invB)
            .exp()
        ),
      zeroDecimal
    )
    .ln()
    .div(invB);
}

const Positions = ({
  account,
  pmSystem,
  markets,
  marketResolutionStates,
  positions,
  collateral,
  lmsrMarketMaker,
  lmsrState,
  positionBalances,
  stagedTradeAmounts,
  setStagedTradeAmounts,
  stagedTransactionType,
  setStagedTransactionType,
  ongoingTransactionType,
  asWrappedTransaction
}) => {
  const [positionGroups, setPositionGroups] = useState(null);

  useEffect(() => {
    if (positionBalances == null) {
      setPositionGroups(null);
    } else {
      const positionGroups = calcPositionGroups(
        markets,
        positions,
        positionBalances
      );
      setPositionGroups(positionGroups);
    }
  }, [markets, positions, positionBalances]);

  const [salePositionGroup, setSalePositionGroup] = useState(null);

  useEffect(() => {
    if (positionGroups == null) {
      setSalePositionGroup(null);
    } else if (salePositionGroup != null) {
      setSalePositionGroup(
        positionGroups.find(
          ({ collectionId }) => collectionId === salePositionGroup.collectionId
        )
      );
    }
  }, [positionGroups]);

  const [saleAmount, setSaleAmount] = useState("");
  const [estimatedSaleEarnings, setEstimatedSaleEarnings] = useState(null);

  const [error, setError] = useState(null);

  useEffect(() => {
    if (stagedTransactionType !== "sell outcome tokens") return;

    if (saleAmount === "") {
      setStagedTradeAmounts(null);
      setEstimatedSaleEarnings(null);
      setError(null);
      return;
    }

    try {
      const saleAmountInUnits = collateral.toUnitsMultiplier.mul(saleAmount);

      if (!saleAmountInUnits.isInteger())
        throw new Error(
          `Got more than ${collateral.decimals} decimals in value ${saleAmount}`
        );

      if (saleAmountInUnits.gt(salePositionGroup.amount.toString()))
        throw new Error(
          `Not enough collateral: missing ${formatCollateral(
            saleAmountInUnits.sub(salePositionGroup.amount.toString()),
            collateral
          )}`
        );

      const stagedTradeAmounts = Array.from(
        { length: positions.length },
        (_, i) =>
          salePositionGroup.positions.find(
            ({ positionIndex }) => positionIndex === i
          ) == null
            ? zeroDecimal
            : saleAmountInUnits.neg()
      );

      setStagedTradeAmounts(stagedTradeAmounts);

      setEstimatedSaleEarnings(
        calcNetCost(lmsrState, stagedTradeAmounts).neg()
      );

      setError(null);
    } catch (e) {
      setStagedTradeAmounts(null);
      setEstimatedSaleEarnings(null);
      setError(e);
    }
  }, [
    stagedTransactionType,
    collateral,
    positions,
    lmsrState,
    salePositionGroup,
    saleAmount
  ]);

  const sellAllTokensOfGroup = useCallback(
    async salePositionGroup => {
      await setStagedTransactionType("sell outcome tokens");

      if (
        !(await pmSystem.isApprovedForAll(account, lmsrMarketMaker.address))
      ) {
        await pmSystem.setApprovalForAll(lmsrMarketMaker.address, true, {
          from: account
        });
      }

      const stagedTradeAmounts = Array.from(
        { length: positions.length },
        (_, i) =>
          salePositionGroup.positions.find(
            ({ positionIndex }) => positionIndex === i
          ) == null
            ? zeroDecimal
            : salePositionGroup.amount.neg()
      );

      const tradeAmounts = stagedTradeAmounts.map(amount => amount.toString());
      const collateralLimit = await lmsrMarketMaker.calcNetCost(tradeAmounts);

      await lmsrMarketMaker.trade(tradeAmounts, collateralLimit, {
        from: account
      });
    },
    [account, lmsrMarketMaker, collateral]
  );

  const sellOutcomeTokens = useCallback(async () => {
    if (stagedTradeAmounts == null) throw new Error(`No sell set yet`);

    if (stagedTransactionType !== "sell outcome tokens")
      throw new Error(
        `Can't sell outcome tokens while staged transaction is to ${stagedTransactionType}`
      );

    if (!(await pmSystem.isApprovedForAll(account, lmsrMarketMaker.address))) {
      await pmSystem.setApprovalForAll(lmsrMarketMaker.address, true, {
        from: account
      });
    }

    const tradeAmounts = stagedTradeAmounts.map(amount => amount.toString());
    const collateralLimit = await lmsrMarketMaker.calcNetCost(tradeAmounts);

    asWrappedTransaction("sell outcome tokens", sellOutcomeTokens, setError);
    await lmsrMarketMaker.trade(tradeAmounts, collateralLimit, {
      from: account
    });
  }, [
    collateral,
    stagedTradeAmounts,
    stagedTransactionType,
    pmSystem,
    asWrappedTransaction,
    account
  ]);

  const marketStage = lmsrState && lmsrState.stage;

  const allMarketsResolved =
    marketResolutionStates &&
    marketResolutionStates.every(({ isResolved }) => isResolved);
  const [redemptionAmount, setRedemptionAmount] = useState(null);
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
        const childCollectionId = padLeft(
          toHex(
            toBN(parentCollectionId)
              .add(toBN(outcome.collectionId))
              .maskn(256)
          ),
          64
        );

        const childPositionId = soliditySha3(
          { t: "address", v: collateral.address },
          { t: "uint", v: childCollectionId }
        );

        await redeemPositionsThroughAllMarkets(
          marketsLeft - 1,
          childCollectionId
        );

        if ((await pmSystem.balanceOf(account, childPositionId)).gtn(0)) {
          indexSets.push(toBN(1).shln(outcomeIndex));
        }
      }

      if (indexSets.length > 0) {
        await pmSystem.redeemPositions(
          collateral.address,
          parentCollectionId,
          market.conditionId,
          indexSets,
          { from: account }
        );
      }
    }

    await redeemPositionsThroughAllMarkets(
      markets.length,
      `0x${"0".repeat(64)}`
    );
  }, [collateral, account, pmSystem]);

  if (positionGroups === null) {
    return (
      <>
        <div className={cx("positions-heading")}>Your Positions</div>
        <div className={cx("positions-empty")}>
          <Spinner width={25} height={25} centered />
        </div>
      </>
    );
  }

  return (
    <>
      <div className={cx("positions-heading")}>Your Positions</div>
      {positionGroups.length === 0 && (
        <div className={cx("positions-empty")}>You have no positions.</div>
      )}
      {allMarketsResolved && (
        <>
          <div className={cx("positions-subheading")}>
            Redeeming your positions will net you a total of{" "}
            {formatCollateral(redemptionAmount, collateral)}
          </div>
          <div className={cx("positions-redeem")}>
            <button
              type="button"
              className={cx("redeem-all")}
              disabled={ongoingTransactionType != null}
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
          {error != null && (
            <span className={cx("error")}>{error.message}</span>
          )}
        </>
      )}
      {!allMarketsResolved && positionGroups.length > 0 && (
        <>
          <div className={cx("positions-subheading")}>
            <span className={cx("position-col-outcome")}>Position</span>
            <span className={cx("position-col-value")}>Current Value</span>
            <span className={cx("position-col-sell")} />
          </div>
          <div className={cx("positions-entries")}>
            {positionGroups.map((positionGroup, index) => (
              <div className={cx("position-entry")} key={index}>
                <div className={cx("position-col-outcome")}>
                  {positionGroup.outcomeSet.map(outcome => (
                    <OutcomeCard
                      {...outcome}
                      key={`${outcome.marketIndex}-${outcome.outcomeIndex}`}
                      glueType="and"
                      // prefixType="IF"
                    />
                  ))}
                </div>
                <div className={cx("position-col-value", "position-values")}>
                  <p className={cx("value")}>
                    {formatCollateral(positionGroup.runningAmount, collateral)}
                  </p>
                  {/*<p>(({positionGroup.margin * 100}%)</p>*/}
                </div>
                <div className={cx("position-col-sell", "position-sell")}>
                  <button
                    className={cx("button")}
                    type="button"
                    disabled={ongoingTransactionType === "sell outcome tokens"}
                    onClick={asWrappedTransaction(
                      "sell outcome tokens",
                      () => sellAllTokensOfGroup(positionGroup),
                      setError
                    )}
                  >
                    {ongoingTransactionType === "sell outcome tokens" ? (
                      <Spinner width={16} height={16} centered inverted />
                    ) : (
                      "Sell"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {error != null && <span className={cn("error")}>{error.message}</span>}
    </>
  );
};

export default Positions;
