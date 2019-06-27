import React from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import { formatCollateral, pseudoMarkdown } from "./utils/formatting";

import cn from "classnames";

const { BN } = Web3.utils;

export default function PositionGroupDetails({ positionGroup, collateral }) {
  return (
    <>
      <div className={cn("value")}>
        <strong>
          {formatCollateral(positionGroup.runningAmount, collateral)}
        </strong>
        &nbsp;
      </div>
      <div className={cn("description")}>
        {positionGroup.outcomeSet.length === 0 ? (
          <span>in any case</span>
        ) : (
          <span>
            when{" "}
            {positionGroup.outcomeSet
              .map(({ when }) => pseudoMarkdown(when))
              .reduce((a, b) => (
                <>
                  {a} <strong>and</strong> {b}
                </>
              ))}
          </span>
        )}
      </div>
    </>
  );
}

PositionGroupDetails.propTypes = {
  positionGroup: PropTypes.shape({
    runningAmount: PropTypes.instanceOf(BN).isRequired,
    outcomeSet: PropTypes.arrayOf(
      PropTypes.shape({
        when: PropTypes.string.isRequired
      }).isRequired
    ).isRequired
  }),
  collateral: PropTypes.shape({
    symbol: PropTypes.string.isRequired,
    decimals: PropTypes.number.isRequired
  }).isRequired
};
