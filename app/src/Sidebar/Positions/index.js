import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import Decimal from "decimal.js-light";
import Spinner from "components/Spinner";
import { zeroDecimal } from "utils/constants";
import { formatCollateral } from "utils/formatting";
import { calcPositionGroups } from "utils/position-groups";
import { getPositionId, combineCollectionIds } from "utils/getIdsUtil";
import { calcSelectedMarketProbabilitiesFromPositionProbabilities } from "utils/probabilities";

import cn from "classnames/bind";
import style from "./positions.scss";
import OutcomeCard, { Dot } from "../../components/OutcomeCard";

const cx = cn.bind(style);
const { toBN } = Web3.utils;

import getConditionalTokensRepo from "../../repositories/ConditionalTokensRepo";
import getMarketMakersRepo from "../../repositories/MarketMakersRepo";
import getConditionalTokensService from "../../services/ConditionalTokensService";
let conditionalTokensRepo;
let marketMakersRepo;
let conditionalTokensService;

const Positions = ({
  account,
  markets,
  marketResolutionStates,
  positions,
  collateral,
  lmsrState,
  positionBalances,
  marketSelections,
  stagedTradeAmounts,
  setStagedTradeAmounts,
  stagedTransactionType,
  setStagedTransactionType,
  ongoingTransactionType,
  asWrappedTransaction
}) => {
  // Memoize fetching data files
  const loadDataLayer = useCallback(() => {
    async function getRepo() {
      conditionalTokensRepo = await getConditionalTokensRepo();
      marketMakersRepo = await getMarketMakersRepo();
      conditionalTokensService = await getConditionalTokensService();
    }
    getRepo();
  }, []);

  // Load data layer just on page load
  useEffect(() => {
    loadDataLayer();
  }, []);

  const [probabilities, setProbabilities] = useState(null);
  const [positionGroups, setPositionGroups] = useState(null);

  useEffect(() => {
    if (lmsrState != null) {
      const { funding, positionBalances: lmsrPositionBalances } = lmsrState;
      const invB = new Decimal(lmsrPositionBalances.length)
        .ln()
        .div(funding.toString());

      const positionProbabilities = lmsrPositionBalances.map(balance =>
        invB
          .mul(balance.toString())
          .neg()
          .exp()
      );
      setProbabilities(
        calcSelectedMarketProbabilitiesFromPositionProbabilities(
          markets,
          positions,
          marketSelections,
          positionProbabilities
        )
      );
    }
  }, [lmsrState, markets, positions]);

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
  }, [markets, positions, positionBalances, marketSelections]);

  const [salePositionGroup, setSalePositionGroup] = useState(null);
  const [currentSellingPosition, setCurrentSellingPosition] = useState(null);

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

  const [estimatedSaleEarnings, setEstimatedSaleEarnings] = useState([]);

  const [error, setError] = useState(null);

  useEffect(() => {
    const getBaseArray = length => {
      return Array(length).fill("0");
    };

    if (marketMakersRepo) {
      (async () => {
        if (!positionBalances) return;
        // Make a call for each available position
        const allEarningCalculations = await Promise.all(
          positionBalances.map((balance, index) => {
            // We get set a position array where we only have 1 position bought
            let balanceForThisPosition = getBaseArray(positionBalances.length);
            // Include in this call only the balance for this position
            balanceForThisPosition[index] = balance.toString();

            // Calculate the balance for this position
            return marketMakersRepo.calcNetCost(balanceForThisPosition);
          })
        );

        setEstimatedSaleEarnings(allEarningCalculations);
      })();
    }
  }, [marketMakersRepo, positionBalances]);

  const sellAllTokensOfGroup = useCallback(
    async salePositionGroup => {
      setCurrentSellingPosition(salePositionGroup);
      await setStagedTransactionType("sell outcome tokens");
      const marketMakerAddress = await marketMakersRepo.getAddress();

      const isOperatorApprovedByOwner = await conditionalTokensRepo.isApprovedForAll(
        account,
        marketMakerAddress
      );

      if (!isOperatorApprovedByOwner) {
        await conditionalTokensRepo.setApprovalForAll(
          marketMakerAddress,
          true,
          account
        );
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
      const collateralLimit = await marketMakersRepo.calcNetCost(tradeAmounts);
      await marketMakersRepo.trade(tradeAmounts, collateralLimit, account);
    },
    [account, marketMakersRepo, collateral]
  );

  const sellOutcomeTokens = useCallback(async () => {
    if (stagedTradeAmounts == null) throw new Error(`No sell set yet`);

    if (stagedTransactionType !== "sell outcome tokens")
      throw new Error(
        `Can't sell outcome tokens while staged transaction is to ${stagedTransactionType}`
      );

    const marketMakerAddress = await marketMakersRepo.getAddress();
    if (
      !(await conditionalTokensRepo.isApprovedForAll(
        account,
        marketMakerAddress
      ))
    ) {
      await conditionalTokensRepo.setApprovalForAll(
        marketMakerAddress,
        true,
        account
      );
    }

    const tradeAmounts = stagedTradeAmounts.map(amount => amount.toString());
    const collateralLimit = await marketMakersRepo.calcNetCost(tradeAmounts);

    asWrappedTransaction("sell outcome tokens", sellOutcomeTokens, setError);
    await marketMakersRepo.trade(tradeAmounts, collateralLimit, account);
  }, [
    collateral,
    stagedTradeAmounts,
    stagedTransactionType,
    conditionalTokensRepo,
    asWrappedTransaction,
    account
  ]);

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
        <table className={cx("position-entries-table")}>
          <thead>
            <tr>
              <td>Position</td>
              <td>Quantity</td>
              <td>Current Value</td>
              <td>Sell Price</td>
              <td></td>
            </tr>
          </thead>
          <tbody>
            {positionGroups.map((positionGroup, index) => (
              <tr key={index}>
                <td>
                  {positionGroup.outcomeSet.length === 0 && (
                    <OutcomeCard
                      {...positionGroup.positions[0].outcomes[0]}
                      outcomeIndex={-1}
                      marketIndex="*"
                      title={"Any"}
                      prefixType="IF"
                    />
                  )}
                  {positionGroup.outcomeSet.map(outcome => (
                    <span
                      key={`${outcome.marketIndex}-${outcome.outcomeIndex}`}
                    >
                      <Dot index={outcome.outcomeIndex} />
                      {outcome.title}
                    </span>
                  ))}
                </td>
                <td>
                  {new Decimal(positionBalances[index].toString())
                    .div(1e18)
                    .toPrecision(4)}
                </td>
                <td>
                  {probabilities && probabilities[positionGroup.outcomeSet[0].marketIndex] ? (
                    formatCollateral(
                      new Decimal(positionBalances[index].toString()).mul(
                        probabilities[positionGroup.outcomeSet[0].marketIndex][index]
                      ),
                      collateral
                    )
                  ) : (
                    <Spinner width={12} height={12} />
                  )}
                </td>
                <td>
                  {estimatedSaleEarnings.length ? (
                    formatCollateral(estimatedSaleEarnings[index], collateral)
                  ) : (
                    <Spinner width={12} height={12} />
                  )}
                </td>
                <td>
                  <button
                    className={cx("position-sell")}
                    type="button"
                    disabled={ongoingTransactionType === "sell outcome tokens"}
                    onClick={asWrappedTransaction(
                      "sell outcome tokens",
                      () => sellAllTokensOfGroup(positionGroup),
                      setError
                    )}
                  >
                    {ongoingTransactionType === "sell outcome tokens" &&
                    (currentSellingPosition &&
                      currentSellingPosition.collectionId ===
                        positionGroup.collectionId) ? (
                      <Spinner width={16} height={16} centered inverted />
                    ) : (
                      "Sell"
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {error != null && <span className={cn("error")}>{error.message}</span>}
    </>
  );
};

export default Positions;
