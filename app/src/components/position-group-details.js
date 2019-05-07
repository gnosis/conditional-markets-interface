import React from "react";
import { formatCollateral, pseudoMarkdown } from "./utils/formatting";

import cn from "classnames";

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
