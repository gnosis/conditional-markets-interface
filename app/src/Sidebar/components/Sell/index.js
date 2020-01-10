import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import { calcPositionGroups } from "utils/position-groups";
import { getPositionId, combineCollectionIds } from "utils/getIdsUtil";
import { getMarketProbabilities } from "utils/probabilities";

const { BN, toBN, sha3 } = Web3.utils;

import getConditionalTokensRepo from "repositories/ConditionalTokensRepo";
import getConditionalTokensService from "services/ConditionalTokensService";
import Sell from "./SellForm";
import Positions from "./Positions";
let conditionalTokensRepo;
let conditionalTokensService;

// let warnedAboutIds = {};

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
    if (lmsrState != null && marketSelections != null) {
      const { funding, positionBalances: lmsrPositionBalances } = lmsrState;

      const { newMarketProbabilities } = getMarketProbabilities(
        funding,
        lmsrPositionBalances,
        markets,
        positions,
        marketSelections
      );
      setProbabilities(newMarketProbabilities);
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
        positionGroups
        //   positionGroups.filter(positionGroup => {
        //     const { amount } = positionGroup;
        //     const isPositionTooSmall = amount.lt(toBN(1e12));
        //     const key = sha3(JSON.stringify(positionGroup));

        //     if (isPositionTooSmall && !warnedAboutIds[key]) {
        //       warnedAboutIds[key] = true; // to ensure it only warns once, otherwise this will be annoying
        //       console.warn(
        //         `A position is too small to be considered in the interface. Hopefully this is not a bug. ${amount.toString()} available of this position.`,
        //         positionGroup
        //       );
        //     }

        //     return !isPositionTooSmall;
        //   })
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

    if (conditionalTokensService) {
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
            return conditionalTokensService
              .calcNetCost(balanceForThisPosition)
              .then(sellPrice => sellPrice.abs());
          })
        );

        setEstimatedSaleEarnings(allEarningCalculations);
      })();
    }
  }, [conditionalTokensService, positionBalances]);

  const makeOutcomeSellSelectHandler = useCallback(
    salePositionGroup => () => {
      setCurrentSellingPosition(salePositionGroup);
    },
    []
  );

  const handleChangeOutcome = useCallback(
    ({ value }) => {
      // TODO: ONLY WORKS WITH BINARY
      setCurrentSellingPosition(positionGroups[value]);
    },
    [positionGroups]
  );

  const clearAllPositions = useCallback(() => {
    setCurrentSellingPosition(null);
    setStagedTransactionType(null);
    setStagedTradeAmounts(null);
    setError(null);
  }, [
    setStagedTransactionType,
    setCurrentSellingPosition,
    setStagedTradeAmounts,
    setError
  ]);

  const sellOutcomeTokens = useCallback(async () => {
    await conditionalTokensService.sellOutcomeTokens({
      stagedTradeAmounts,
      stagedTransactionType,
      account
    });
    clearAllPositions();
  }, [
    stagedTradeAmounts,
    stagedTransactionType,
    conditionalTokensService,
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

  const isSelling = currentSellingPosition != null;

  return isSelling ? (
    <Sell
      markets={markets}
      currentSellingPosition={currentSellingPosition}
      onCancelSell={clearAllPositions}
      positions={positions}
      positionBalances={positionBalances}
      stagedTradeAmounts={stagedTradeAmounts}
      setStagedTransactionType={setStagedTransactionType}
      setStagedTradeAmounts={setStagedTradeAmounts}
      conditionalTokensService={conditionalTokensService}
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
      showHeader={false}
    />
  );
};

SellOrPositions.propTypes = {
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
    marketMakerAddress: PropTypes.string.isRequired,
    funding: PropTypes.instanceOf(BN).isRequired,
    positionBalances: PropTypes.arrayOf(PropTypes.instanceOf(BN).isRequired)
      .isRequired
  })
};

export default SellOrPositions;
