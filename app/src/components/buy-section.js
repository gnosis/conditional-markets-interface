import React from "react";
import PropTypes from "prop-types";
import Decimal from "decimal.js";
import Spinner from "./spinner";

import { arrayToHumanReadableList } from "./utils/list";
import { formatFromWei, pseudoMarkdown } from "./utils/formatting";

import cn from "classnames";

const BuySection = ({
  collateral,
  collateralBalance,

  stagedPositions,

  validPosition,
  hasEnoughAllowance,
  invest,
  buyError,
  isBuying,

  handleSelectInvest,
  handleSetAllowance,
  handleBuyOutcomes
}) => (
  <div className={cn("positions")}>
    <p>Your balance: {formatFromWei(collateralBalance.amount)}</p>
    {collateral.isWETH && (
      <p>
        Your unwrapped balance:{" "}
        {formatFromWei(collateralBalance.unwrappedAmount)}
      </p>
    )}
    <input
      type="text"
      placeholder={`Your Invest in ${collateral.name}`}
      value={invest}
      onChange={handleSelectInvest}
    />
    <button
      type="button"
      disabled={!hasEnoughAllowance || !validPosition || isBuying || !!buyError}
      onClick={handleBuyOutcomes}
    >
      {isBuying ? <Spinner centered inverted width={25} height={25} /> : "Buy"}
    </button>
    {!hasEnoughAllowance && (
      <button
        type="button"
        disabled={hasEnoughAllowance}
        onClick={handleSetAllowance}
      >
        {isBuying ? (
          <Spinner centered inverted width={25} height={25} />
        ) : (
          "Toggle Allowance"
        )}
      </button>
    )}
    {buyError && (
      <span className={cn("error")}>
        {buyError === true ? "An error has occured" : buyError}
      </span>
    )}

    {validPosition && !isBuying && !buyError && stagedPositions.length > 0 && (
      <div>
        <div>You will receive:</div>
        {stagedPositions.map((position, index) => (
          <div key={index} className={cn("position")}>
            <div className={cn("value")}>
              <strong>
                {formatFromWei(position.value, collateral.symbol)}
              </strong>
              &nbsp;
            </div>
            <div className={cn("description")}>
              {position.outcomeIds === "" ? (
                position.value > 0 && <span>In any Case</span>
              ) : (
                <span>
                  when{" "}
                  {arrayToHumanReadableList(
                    position.markets.map(market =>
                      market.selectedOutcome === 0
                        ? pseudoMarkdown(market.when)
                        : pseudoMarkdown(market.whenNot)
                    )
                  )}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

BuySection.propTypes = {
  collateral: PropTypes.shape({
    name: PropTypes.string.isRequired,
    symbol: PropTypes.string.isRequired
  }).isRequired,
  collateralBalance: PropTypes.shape({
    amount: PropTypes.instanceOf(Decimal).isRequired,
    isWETH: PropTypes.bool,
    unwrappedAmount: PropTypes.string
  }).isRequired,

  stagedPositions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      outcomeIds: PropTypes.string.isRequired,
      markets: PropTypes.arrayOf(
        PropTypes.shape({
          selectedOutcome: PropTypes.number.isRequired,
          when: PropTypes.string.isRequired,
          whenNot: PropTypes.string.isRequired
        }).isRequired
      ).isRequired
    }).isRequired
  ).isRequired,

  validPosition: PropTypes.bool.isRequired,
  hasEnoughAllowance: PropTypes.bool.isRequired,
  invest: PropTypes.string.isRequired,
  buyError: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]).isRequired,
  isBuying: PropTypes.bool.isRequired,

  handleBuyOutcomes: PropTypes.func.isRequired,
  handleSelectInvest: PropTypes.func.isRequired,
  handleSetAllowance: PropTypes.func.isRequired
};

export default BuySection;
