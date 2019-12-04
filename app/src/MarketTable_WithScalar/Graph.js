import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  isValidElement
} from "react";
import moment from "moment";
import { formatScalarValue } from "utils/formatting";
import cn from "classnames/bind";

import styles from "./Graph.scss";

const cx = cn.bind(styles);

const GRAPH_TOOLTIP_STYLES = {
  left: "100%"
};

const GRAPH_TOOLTIP_CURRENT_STYLES = {
  ...GRAPH_TOOLTIP_STYLES,
  background: "green"
};

import {
  LineChart,
  XAxis,
  YAxis,
  Line,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot
} from "recharts";

const formatDateTick = tick => {
  return moment(tick).format("MMM D");
};

/*
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
*/

const StaticTooltip = props => {
  console.log(props);
  const { viewBox } = props;
  return (
    <g {...viewBox}>
      <Text>Hallo</Text>
    </g>
  );
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
  entries,
  queryData,
  currentProbability
}) => {
  const [data, setData] = useState(entries);

  const [tooltipPosition, setTooltipPosition] = useState(null);
  const [lastTickPosition, setLastTickPosition] = useState(null);

  const lineRef = useRef(null);

  useEffect(() => {
    const newData = [
      ...entries,
      {
        value:
          currentProbability.toNumber() * (upperBound - lowerBound) +
          lowerBound,
        date: +new Date()
      }
    ];

    setData(newData);

    if (lineRef.current) {
      const tickPosition = lineRef.current.props.points[newData.length - 1];
      setLastTickPosition(tickPosition);
    }
  }, [queryData, lineRef]);

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
    <div className={cx("graph-container")}>
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
          <ReferenceDot
            x={entries[entries.length - 1].date}
            y={entries[entries.length - 1].value}
            r={0}
            fill="red"
            stroke="none"
          />
          <XAxis
            dataKey="index"
            //domain={[data && data[0] ? data[0].date : 0, "dataMax"]}
            type="number"
            //tickFormatter={formatDateTick}
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
      {lastTickPosition && (
        <div
          className={cx("static-tooltip")}
          style={{ top: `${lastTickPosition.y}px` }}
        >
          <TooltipContent
            active
            payload={[entries[entries.length - 1]]}
            unit={unit}
            decimals={decimals}
          />
        </div>
      )}
    </div>
  );
};

export default Graph;
