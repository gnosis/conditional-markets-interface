import React, { useEffect } from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import Decimal from "decimal.js-light";
import OutcomesBinary from "./outcomes-binary";
import OutcomeSelection from "./outcome-selection";
import Spinner from "./spinner";
import { formatProbability } from "./utils/formatting";

import cn from "classnames";

const { BN } = Web3.utils;

const Market = ({
  conditionId,

  title,
  resolutionDate,
  outcomes,

  resolutionState,

  probabilities,
  stagedProbabilities,

  marketSelection,
  setMarketSelection
}) => {
  const isResolved = resolutionState && resolutionState.isResolved;
  let resultOutcomeIndex = null;
  if (isResolved) {
    resultOutcomeIndex = resolutionState.payoutNumerators.findIndex(n =>
      n.gtn(0)
    );
    if (
      resolutionState.payoutNumerators.some(
        (n, i) => resultOutcomeIndex !== i && n.gtn(0)
      )
    ) {
      // there can only be one nonzero numerator for the result outcome index to be well defined
      resultOutcomeIndex = null;
    }
  }

  useEffect(() => {
    // If any condition has been resolved to having one outcome slot being the reported outcome,
    // we want to make sure that the condition is not assumed either way
    // so that probability estimates for the unresolved conditions will be accurate.

    // We also select the reported outcome for future trades so that
    // any trades after the report will be "discounted" for the user depending on how uncertain
    // the market maker is until the market maker gets closed.
    if (resultOutcomeIndex != null) {
      setMarketSelection({
        selectedOutcomeIndex: resultOutcomeIndex,
        isAssumed: false
      });
    }
  }, [resultOutcomeIndex]);

  return (
    <article className={cn("market")}>
      <section className={cn("title-section")}>
        <h1 className={cn("title")}>{title}</h1>
        <div className={cn("title-infos")}>
          {isResolved ? (
            <>
              <div className={cn("title-info")}>
                <h2 className={cn("label")}>reported outcome</h2>
                <h2 className={cn("value", "centered")}>
                  {resultOutcomeIndex != null
                    ? outcomes[resultOutcomeIndex].title
                    : "Mixed"}
                </h2>
              </div>
            </>
          ) : (
            <>
              <div className={cn("title-info")}>
                <h2 className={cn("label")}>probability</h2>
                <h2 className={cn("value")}>
                  {probabilities == null ? (
                    <Spinner width={25} height={25} />
                  ) : (
                    formatProbability(probabilities[0])
                  )}
                </h2>
              </div>
              <div className={cn("title-info")}>
                <h2 className={cn("label")}>resolves</h2>
                <h2 className={cn("value")}>
                  {new Date(resolutionDate).toLocaleString()}
                </h2>
              </div>
            </>
          )}
        </div>
      </section>
      {!isResolved && (
        <>
          <section className={cn("outcomes-section")}>
            <OutcomesBinary
              {...{
                outcomes,
                probabilities,
                stagedProbabilities
              }}
            />
          </section>
          <section className={cn("selection-section")}>
            <OutcomeSelection
              {...{
                outcomes,
                conditionId,
                marketSelection,
                setMarketSelection
              }}
            />
          </section>
        </>
      )}
    </article>
  );
};

Market.propTypes = {
  conditionId: PropTypes.any.isRequired,

  title: PropTypes.string.isRequired,
  resolutionDate: PropTypes.string.isRequired,
  outcomes: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired
    }).isRequired
  ).isRequired,

  resolutionState: PropTypes.shape({
    isResolved: PropTypes.bool.isRequired,
    payoutNumerators: PropTypes.arrayOf(PropTypes.instanceOf(BN).isRequired)
      .isRequired
  }),

  probabilities: PropTypes.arrayOf(PropTypes.instanceOf(Decimal)),

  stagedProbabilities: PropTypes.arrayOf(
    PropTypes.instanceOf(Decimal).isRequired
  ),

  marketSelection: PropTypes.any,
  setMarketSelection: PropTypes.any.isRequired
};

Market.defaultProps = {
  selectedOutcomes: {}
};

export default Market;
