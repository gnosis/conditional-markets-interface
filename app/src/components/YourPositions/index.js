import React from "react";
import Decimal from "decimal.js";
import cn from 'classnames/bind'

import { arrayToHumanReadableList } from "./utils/list";
import { formatFromWei, pseudoMarkdown } from "./utils/formatting";

import style from './style.scss'

const cx = cn.bind(style)

const YourPositions = ({ positions }) => (
  <div className={cx("your-positions")}>
    <h2>Positions</h2>
    {!positions.length && <em>You don't hold any positions yet.</em>}
    {positions.map((position, index) => (
      <div key={index} className={cx("position")}>
        {position.outcomeIds === "" ? (
          position.value > 0 && (
            <span>
              <strong>{formatFromWei(position.value)}</strong> In any Case
            </span>
          )
        ) : (
          <>
            <strong>{formatFromWei(position.value)}</strong>{" "}
            when{" "}
            {arrayToHumanReadableList(
              position.markets.map(market => market.selectedOutcome === 0 ? pseudoMarkdown(market.when) : pseudoMarkdown(market.whenNot))
            )}
          </>
        )}
      </div>
    ))}
  </div>
);

export default YourPositions;
