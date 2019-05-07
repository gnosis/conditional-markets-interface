import React from "react";
import PropTypes from "prop-types";
import Decimal from "decimal.js-light";
import OutcomesBinary from "./outcomes-binary";
import OutcomeSelection from "./outcome-selection";
import Spinner from "./spinner";
import { formatProbability } from "./utils/formatting";

import cn from "classnames";

const Market = ({
  conditionId,

  title,
  resolutionDate,
  outcomes,

  probabilities,
  stagedProbabilities,

  marketSelection,
  setMarketSelection
}) => {
  const isResolved = false;
  const disabled = false;
  const result = null;

  return (
    <article className={cn("market", { disabled })}>
      <section className={cn("title-section")}>
        <h1 className={cn("title")}>{title}</h1>
        <div className={cn("title-infos")}>
          <div className={cn("title-info")}>
            {isResolved ? (
              <>
                <h2 className={cn("label")}>winning outcome</h2>
                <h2 className={cn("value", "centered")}>
                  {outcomes[result].title}
                </h2>
              </>
            ) : (
              <>
                <h2 className={cn("label")}>probability</h2>
                <h2 className={cn("value")}>
                  {probabilities == null ? (
                    <Spinner width={25} height={25} />
                  ) : (
                    formatProbability(probabilities[0])
                  )}
                </h2>
              </>
            )}
          </div>
          {isResolved ? (
            <div className={cn("title-info")}>
              <h2 className={cn("label")}>market closed</h2>
              <h2 className={cn("value")} />
            </div>
          ) : (
            <div className={cn("title-info")}>
              <h2 className={cn("label")}>resolves</h2>
              <h2 className={cn("value")}>
                {new Date(resolutionDate).toLocaleString()}
              </h2>
            </div>
          )}
        </div>
      </section>
      <section className={cn("outcomes-section")}>
        <OutcomesBinary
          {...{
            outcomes,
            probabilities,
            stagedProbabilities,
            isResolved
          }}
        />
      </section>

      {!isResolved && (
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
