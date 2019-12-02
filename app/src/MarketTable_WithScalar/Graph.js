import React, { useEffect, useState, useCallback, useRef } from "react";
import moment from "moment";
import { formatScalarValue } from "utils/formatting";
import cn from "classnames/bind";

import styles from "./Graph.scss";

const cx = cn.bind(styles);

const GRAPH_TOOLTIP_STYLES = {
  left: "100%"
};

import {
  LineChart,
  XAxis,
  YAxis,
  Line,
  Tooltip,
  ResponsiveContainer
} from "recharts";

//import Tooltip from "components/Graph/Tooltip";

const formatDateTick = tick => {
  return moment(tick).format("MMM D");
};

const makeMockData = (min, max, currentProbability) => {
  const totalElements = 20;
  const data = Array(totalElements)
    .fill(null)
    .map((_, i) => {
      const date = moment()
        .subtract(totalElements - i, "days")
        .valueOf();
      const value = Math.random() * (max - min) + min;

      return {
        date,
        value
      };
    });

  // Add current probability
  data.push({
    date: moment().valueOf(),
    value: currentProbability.valueOf() * (max - min) + min
  });
  return data;
};

const TooltipContent = ({ active, payload, unit, decimals }) => {
  if (active) {
    return (
      <div className={cx("tooltip")}>
        {formatScalarValue(payload[0].value, unit, decimals)}
      </div>
    );
  }

  return null;
};

const Graph = ({
  lowerBound,
  upperBound,
  decimals,
  unit,
  lmsrAddress,
  currentProbability
}) => {
  const [data, setData] = useState([]);
  useEffect(() => {
    setData(makeMockData(lowerBound, upperBound, currentProbability));
  }, [lowerBound, upperBound]);

  const [tooltipPosition, setTooltipPosition] = useState(null);
  const lineRef = useRef(null);

  const mouseUpdate = useCallback(
    e => {
      //console.log(e.activeCoordinate);
      //console.log(JSON.stringify(e, null, 2))
      if (lineRef.current && e && e.activeTooltipIndex != null) {
        const tickPosition = lineRef.current.props.points[e.activeTooltipIndex];

        setTooltipPosition({ x: 0, y: tickPosition.y });
      }
    },
    [lineRef]
  );

  return (
    <ResponsiveContainer minHeight={300}>
      <LineChart data={data} onMouseMove={mouseUpdate}>
        {tooltipPosition && (
          <Tooltip
            cursor={{ stroke: "#02ae60", strokeWidth: 2 }}
            coordinate={{ x: 0, y: 0 }}
            position={{ x: 0, y: tooltipPosition.y }}
            wrapperStyle={GRAPH_TOOLTIP_STYLES}
            content={<TooltipContent unit={unit} decimals={decimals} />}
          />
        )}
        <XAxis
          dataKey="date"
          domain={[data && data[0] ? data[0].date : 0, "dataMax"]}
          type="number"
          tickFormatter={formatDateTick}
          interval="preserveEnd"
        />
        <YAxis
          orientation="right"
          type="number"
          domain={[lowerBound, upperBound]}
        />
        <Line
          type="stepBefore"
          dataKey="value"
          stroke="#8884d8"
          ref={lineRef}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default Graph;
