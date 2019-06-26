import React from "react";
import PropTypes from "prop-types";

import cn from "classnames";

const OutcomeSelection = ({
  outcomes,
  marketSelection,
  setMarketSelection
}) => (
  <div className={cn("outcome-selection")}>
    <div className={cn("row-outcomes")}>
      {outcomes.map((outcome, index) => (
        <button
          type="button"
          disabled={marketSelection == null}
          key={outcome.collectionId}
          className={cn("selection", {
            selected:
              marketSelection != null &&
              marketSelection.selectedOutcomeIndex == index
          })}
          onClick={() =>
            setMarketSelection({
              selectedOutcomeIndex: index,
              isAssumed: marketSelection.isAssumed
            })
          }
        >
          {outcome.short}
        </button>
      ))}
      <button
        type="button"
        disabled={marketSelection == null}
        className={cn("selection", {
          selected:
            marketSelection != null &&
            marketSelection.selectedOutcomeIndex == null
        })}
        onClick={() =>
          setMarketSelection({ selectedOutcomeIndex: null, isAssumed: false })
        }
      >
        {"I don't know"}
      </button>
    </div>
    <div className={cn("row-assume")}>
      <button
        type="button"
        disabled={
          marketSelection == null ||
          marketSelection.selectedOutcomeIndex == null
        }
        className={cn("assume", {
          selected: marketSelection != null && marketSelection.isAssumed
        })}
        onClick={() =>
          setMarketSelection({
            selectedOutcomeIndex: marketSelection.selectedOutcomeIndex,
            isAssumed: !marketSelection.isAssumed
          })
        }
      >
        <div>
          {marketSelection != null &&
            marketSelection.selectedOutcomeIndex != null && (
              <input
                type="checkbox"
                readOnly
                checked={marketSelection.isAssumed}
              />
            )}
          <label>
            {marketSelection != null
              ? marketSelection.selectedOutcomeIndex == null
                ? "To select an assumption, make a selection above"
                : `Assuming "${
                    outcomes[marketSelection.selectedOutcomeIndex].short
                  }" occurred`
              : "Loading..."}
          </label>
        </div>
      </button>
    </div>
  </div>
);

OutcomeSelection.propTypes = {
  outcomes: PropTypes.arrayOf(
    PropTypes.shape({
      short: PropTypes.string.isRequired
    }).isRequired
  ).isRequired,
  marketSelection: PropTypes.shape({
    selectedOutcomeIndex: PropTypes.number,
    isAssumed: PropTypes.bool.isRequired
  }),
  setMarketSelection: PropTypes.func.isRequired
};

export default OutcomeSelection;
