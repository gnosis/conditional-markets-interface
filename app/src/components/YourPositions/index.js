import React from "react";
import Decimal from "decimal.js";

import { arrayToHumanReadableList } from "./utils/list";

const YourPositions = ({ positions }) => (
  <div>
    <h2>Positions</h2>
    {!positions && <em>You don't hold any positions yet.</em>}
    {positions.map((position, index) => (
      <div key={index}>
        {position.outcomeIds === "*" ? (
          position.value > 0 && (
            <span>
              <strong>{position.value} wei</strong> In any Case
            </span>
          )
        ) : (
          <>
            <strong>{new Decimal(position.value).abs().toString()} wei</strong>{" "}
            when{" "}
            {arrayToHumanReadableList(
              position.markets.map(market => market.selectedOutcome === 0 ? market.when : market.whenNot)
            )}
          </>
        )}
      </div>
    ))}
  </div>
);

export default YourPositions;
