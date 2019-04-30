import React from "react";
import PropTypes from "prop-types";
import classnames from "classnames/bind";
import Spinner from "../Spinner";

import { arrayToHumanReadableList } from "../YourPositions/utils/list";
import {
  formatFromWei,
  pseudoMarkdown
} from "../YourPositions/utils/formatting";

import style from "./style.scss";

const cx = classnames.bind(style);

const BuySection = ({
  handleBuyOutcomes,
  handleSelectInvest,
  handleSetAllowance,
  invest,
  validPosition,
  isBuying,
  buyError,
  collateral,
  stagedPositions,
  hasAllowance
}) => (
  <div className={cx("positions")}>
    <input
      type="text"
      placeholder={`Your Invest in ${collateral.name}`}
      value={invest}
      onChange={handleSelectInvest}
    />
    <button
      type="button"
      disabled={!hasAllowance || !validPosition || isBuying || !!buyError}
      onClick={handleBuyOutcomes}
    >
      {isBuying ? <Spinner centered inverted width={25} height={25} /> : "Buy"}
    </button>
    {!hasAllowance && (
      <button
        type="button"
        disabled={hasAllowance}
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
      <span className={cx("error")}>
        {buyError === true ? "An error has occured" : buyError}
      </span>
    )}

    {validPosition && !isBuying && !buyError && stagedPositions.length > 0 && (
      <div>
        <div>You will receive:</div>
        {stagedPositions.map((position, index) => (
          <div key={index} className={cx("position")}>
            <div className={cx("value")}>
              <strong>
                {formatFromWei(position.value, collateral.symbol)}
              </strong>
              &nbsp;
            </div>
            <div className={cx("description")}>
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
  handleBuyOutcomes: PropTypes.func.isRequired,
  handleSelectInvest: PropTypes.func.isRequired,
  handleSetAllowance: PropTypes.func.isRequired,
  invest: PropTypes.string.isRequired,
  validPosition: PropTypes.bool.isRequired,
  isBuying: PropTypes.bool.isRequired,
  buyError: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]).isRequired,
  collateral: PropTypes.shape({
    name: PropTypes.string.isRequired,
    symbol: PropTypes.string.isRequired
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
  hasAllowance: PropTypes.bool.isRequired
};

export default BuySection;
