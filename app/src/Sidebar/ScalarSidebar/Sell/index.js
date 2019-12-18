import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import Decimal from "decimal.js-light";
import Spinner from "components/Spinner";
import { zeroDecimal } from "utils/constants";
import { formatCollateral, formatAmount } from "utils/formatting";
import { calcPositionGroups } from "utils/position-groups";
import { getPositionId, combineCollectionIds } from "utils/getIdsUtil";
import { calcSelectedMarketProbabilitiesFromPositionProbabilities } from "utils/probabilities";

import cn from "classnames/bind";
import style from "./positions.scss";

const cx = cn.bind(style);
const { toBN, sha3 } = Web3.utils;

import getConditionalTokensRepo from "repositories/ConditionalTokensRepo";
import getMarketMakersRepo from "repositories/MarketMakersRepo";
import getConditionalTokensService from "services/ConditionalTokensService";
import Sell from "./Sell";
import Positions from "./Positions";
let conditionalTokensRepo;
let marketMakersRepo;
let conditionalTokensService;

let warnedAboutIds = {};

const SellOrPositions = ({
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
      setPositionGroups(
        positionGroups.filter(positionGroup => {
          const { amount } = positionGroup;
          const isPositionTooSmall = amount.lt(toBN(1e12));
          const key = sha3(JSON.stringify(positionGroup));

          if (isPositionTooSmall && !warnedAboutIds[key]) {
            warnedAboutIds[key] = true; // to ensure it only warns once, otherwise this will be annoying
            console.warn(
              `A position is too small to be considered in the interface. Hopefully this is not a bug. ${amount.toString()} available of this position.`,
              positionGroup
            );
          }

          return !isPositionTooSmall;
        })
      );
    }
  }, [markets, positions, positionBalances, marketSelections]);

  const [currentSellingPosition, setCurrentSellingPosition] = useState(null);
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
            // Note the negative value, it's because of being a sell price
            balanceForThisPosition[index] = balance.neg().toString();

            // Calculate the balance for this position
            // return as positive value for the frontend
            return marketMakersRepo
              .calcNetCost(balanceForThisPosition)
              .then(sellPrice => sellPrice.abs());
          })
        );

        setEstimatedSaleEarnings(allEarningCalculations);
      })();
    }
  }, [marketMakersRepo, positionBalances]);

  const makeOutcomeSellSelectHandler = useCallback(
    salePositionGroup => () => {
      setCurrentSellingPosition(salePositionGroup);
    },
    []
  );

  const handleCancelSell = useCallback(() => {
    setCurrentSellingPosition(null);
    setStagedTransactionType(null);
    setStagedTradeAmounts(null);
  }, []);

  const handleChangeOutcome = useCallback(
    ({ value }) => {
      // TODO: ONLY WORKS WITH BINARY
      setCurrentSellingPosition(positionGroups[value]);
    },
    [positionGroups]
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
    setCurrentSellingPosition(null);
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
        <div className={cx("positions-empty")}>
          <Spinner width={25} height={25} centered />
        </div>
      </>
    );
  }

  const isSelling = currentSellingPosition != null;

  return isSelling ? (
    <Sell
      markets={markets}
      currentSellingPosition={currentSellingPosition}
      onCancelSell={handleCancelSell}
      positions={positions}
      positionBalances={positionBalances}
      stagedTradeAmounts={stagedTradeAmounts}
      setStagedTransactionType={setStagedTransactionType}
      setStagedTradeAmounts={setStagedTradeAmounts}
      marketMakersRepo={marketMakersRepo}
      collateral={collateral}
      sellOutcomeTokens={sellOutcomeTokens}
      onOutcomeChange={handleChangeOutcome}
      asWrappedTransaction={asWrappedTransaction}
      ongoingTransactionType={ongoingTransactionType}
      positionGroups={positionGroups}
    />
  ) : (
    <Positions
      positionGroups={positionGroups}
      allMarketsResolved={allMarketsResolved}
      redemptionAmount={redemptionAmount}
      collateral={collateral}
      redeemPositions={redeemPositions}
      setError={setError}
      ongoingTransactionType={ongoingTransactionType}
      asWrappedTransaction={asWrappedTransaction}
      probabilities={probabilities}
      positionBalances={positionBalances}
      estimatedSaleEarnings={estimatedSaleEarnings}
      currentSellingPosition={currentSellingPosition}
      makeOutcomeSellSelectHandler={makeOutcomeSellSelectHandler}
      error={error}
    />
  );
};

export default SellOrPositions;
