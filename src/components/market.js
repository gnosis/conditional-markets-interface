import React from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import Decimal from "decimal.js-light";
import OutcomesBinary from "./outcomes-binary";
import OutcomeSelection from "./outcome-selection";
import Spinner from "./spinner";
import { formatProbability } from "../utils/formatting";

import cn from "classnames";

const { BN } = Web3.utils;

const Market = ({
  conditionId,

  title,
  resolutionDate,
  outcomes,

  lmsrState,
  resolutionState,

  probabilities,
  stagedProbabilities,

  marketSelection,
  setMarketSelection
}) => {
  const marketStage = lmsrState && lmsrState.stage;
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

  return (
    <article className={cn("market")}>
      <section className={cn("title-section")}>
        <h2 className={cn("title")}>{title}</h2>
        <div className={cn("title-infos")}>
          {marketStage !== "Closed" && (
            <div className={cn("title-info")}>
              <h3 className={cn("label")}>Probability</h3>
              <h3 className={cn("value")}>
                {probabilities == null ? (
                  <Spinner width={25} height={25} />
                ) : (
                  formatProbability(probabilities[0])
                )}
              </h3>
            </div>
          )}
          {isResolved ? (
            <div className={cn("title-info")}>
              <h3 className={cn("label")}>Reported Outcome</h3>
              <h3 className={cn("value", "centered")}>
                {resultOutcomeIndex != null
                  ? outcomes[resultOutcomeIndex].title
                  : "Mixed"}
              </h3>
            </div>
          ) : (
            <div className={cn("title-info")}>
              <h3 className={cn("label")}>Resolves</h3>
              <h3 className={cn("value")}>
                {new Date(resolutionDate).toLocaleString()}
              </h3>
            </div>
          )}
        </div>
      </section>
      {marketStage !== "Closed" && (
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

  lmsrState: PropTypes.shape({
    stage: PropTypes.string.isRequired
  }),
  resolutionState: PropTypes.shape({
    isResolved: PropTypes.bool.isRequired,
    payoutNumerators: PropTypes.arrayOf(PropTypes.instanceOf(BN).isRequired)
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
