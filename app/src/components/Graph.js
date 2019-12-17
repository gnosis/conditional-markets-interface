import React, { useEffect, useState, useCallback, useRef } from "react";
import moment from "moment";
import { formatScalarValue } from "utils/formatting";
import cn from "classnames/bind";

import styles from "./Graph.scss";

import { blueColor, redColor } from "scss/_variables.scss";

const scalarMarketColor = {
  0: "#8884d8"
};
const categoricalMarketColors = {
  0: blueColor,
  1: redColor
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

const cx = cn.bind(styles);

const CursorWithLineConnection = props => {
  //console.log(props.width)
  const {
    points,
    currentPositionTooltipCoordinates,
    selectedPositionTooltipCoordinates,
    width,
    ...restProps
  } = props;

  return (
    <g>
      <line
        x1={points[0].x}
        x2={points[1].x}
        y1={points[0].y}
        y2={points[1].y}
        style={{
          stroke: "#02ae60",
          strokeWidth: 2
        }}
      />
      <line
        x1={points[0].x}
        x2={width + 5}
        y1={currentPositionTooltipCoordinates.y}
        y2={currentPositionTooltipCoordinates.y}
        style={{
          stroke: "#02ae60",
          strokeDasharray: "2,2"
        }}
      />
      <line
        x1={points[0].x}
        x2={width + 5}
        y1={selectedPositionTooltipCoordinates.y}
        y2={selectedPositionTooltipCoordinates.y}
        style={{
          stroke: "#02ae60",
          strokeDasharray: "1,1"
        }}
      />
      <circle
        cx={points[0].x}
        cy={currentPositionTooltipCoordinates.y}
        r={5}
        fill="#009cb4"
      />
    </g>
  );
};

const TooltipContent = ({ active, value, payload, unit, decimals }) => {
  if (active) {
    const number = value || payload[0].value;
    return (
      <div className={cx("tooltip-inner")}>
        {formatScalarValue(number, unit, decimals)}
      </div>
    );
  }

  return null;
};

const Graph = ({
  lowerBound,
  upperBound,
  decimals: parentDecimals,
  unit,
  entries,
  queryData,
  currentProbability,
  marketType
}) => {
  const [decimals, setDecimals] = useState(parentDecimals || 2);

  const [data, setData] = useState(entries);
  const [sidebarWidth, setSidebarWidth] = useState(0);

  const [tooltipPosition, setTooltipPosition] = useState(null);
  const [lastTickPosition, setLastTickPosition] = useState(null);

  const lineRef = useRef(null);
  const lineChartRef = useRef(null);

  useEffect(() => {
    // TODO queryData and currentProbability are constantly updating. As data
    // object is updated each render the graph is re-rendered continously.
    // Check how to cache queryData and current probability to avoid components
    // extra work that includes currentProbabilityChanged and if array lengths are different
    const currentProbabilityChanged = () => {
      const dataProbability = data[data.length - 1].outcomesProbability;
      return (
        dataProbability.length !== currentProbability.length ||
        dataProbability.some(
          (value, index) => value !== currentProbability[index]
        )
      );
    };

    if (entries.length >= data.length || currentProbabilityChanged()) {
      const newData = [
        ...entries,
        {
          outcomesProbability: currentProbability,
          // currentProbability
          //   .mul(upperBound - lowerBound)
          //   .add(lowerBound)
          //   .toNumber(),
          date: +new Date(),
          index: entries.length
        }
      ];

      setData(newData);
    }
  }, [queryData, currentProbability, lineRef.current, lowerBound, upperBound]);

  useEffect(() => {
    if (lineRef.current) {
      // position of selected tick
      const tickPosition =
        lineRef.current.props.points[lineRef.current.props.points.length - 1];
      setLastTickPosition({
        x: lineRef.current.props.width,
        y: tickPosition.y
      });
    }

    if (lineRef.current && lineChartRef.current) {
      // linechart sidebar (legend, padding, etc) calculation
      const lineChartSidebarWidth =
        lineChartRef.current.props.width -
        (lineRef.current.props.width + lineChartRef.current.props.margin.left);
      setSidebarWidth(lineChartSidebarWidth);
    }
  }, [lineRef.current, lineChartRef.current, data]);

  const mouseUpdate = useCallback(
    e => {
      if (lineRef.current && e && e.activeTooltipIndex != null) {
        const tickPosition = lineRef.current.props.points[e.activeTooltipIndex];

        setTooltipPosition({ x: tickPosition.x, y: tickPosition.y });
      }
    },
    [lineRef.current]
  );

  const formatDateTick = useCallback(tick => {
    return moment(tick).format("MMM D");
  });

  const formatDateTickTooltip = useCallback(tick => {
    return moment(tick).format("MMM D HH:mm");
  });

  if (data.length <= 2) {
    return (
      <div className={cx("graph-container", "empty")}>
        <span>No data yet.</span>
      </div>
    );
  }

  const marketClass = marketType.toLowerCase() + "-graph";

  return (
    <div className={cx("graph-container", marketClass)}>
      <ResponsiveContainer minHeight={300}>
        <LineChart data={data} onMouseMove={mouseUpdate} ref={lineChartRef}>
          {tooltipPosition && marketType === "SCALAR" && (
            <Tooltip
              cursor={
                <CursorWithLineConnection
                  currentPositionTooltipCoordinates={lastTickPosition}
                  selectedPositionTooltipCoordinates={tooltipPosition}
                />
              }
              coordinate={{ x: 0, y: 0 }}
              position={{ x: -sidebarWidth, y: tooltipPosition.y }}
              content={<TooltipContent unit={unit} decimals={decimals} />}
            />
          )}
          {marketType !== "SCALAR" && (
            <Tooltip
              labelFormatter={formatDateTickTooltip}
              formatter={value => {
                return [value.toFixed(2) + "%"];
              }}
            />
          )}
          {data &&
            data[data.length - 1] &&
            data[data.length - 1].outcomesProbability.map((value, index) => {
              const fill =
                marketType === "CATEGORICAL"
                  ? categoricalMarketColors[index]
                  : scalarMarketColor[index];
              return (
                <ReferenceDot
                  key={index}
                  x={data[data.length - 1].date}
                  y={value}
                  r={5}
                  fill={fill}
                  stroke="none"
                />
              );
            })}
          <XAxis
            dataKey="date"
            minTickGap={100}
            domain={[data && data[0] ? "dataMin" : 0, "dataMax"]}
            tickFormatter={formatDateTick}
            interval="preserveEnd"
          />
          <YAxis
            orientation="right"
            type="number"
            domain={[parseFloat(lowerBound), parseFloat(upperBound)]}
          />
          {data &&
            data[0] &&
            data[0].outcomesProbability.map((value, index) => {
              const dataKey = "outcomesProbability[" + index + "]";
              const stroke =
                marketType === "CATEGORICAL"
                  ? categoricalMarketColors[index]
                  : scalarMarketColor[index];
              return (
                <Line
                  key={index}
                  type="stepBefore"
                  dataKey={dataKey}
                  stroke={stroke}
                  ref={lineRef}
                />
              );
            })}
        </LineChart>
      </ResponsiveContainer>
      {lastTickPosition && marketType === "SCALAR" && (
        <div
          className={cx("tooltip-current-position")}
          style={{
            transform: `translate(${-sidebarWidth}px, ${lastTickPosition.y}px)`
          }}
        >
          {data &&
            data[data.length - 1] &&
            data[data.length - 1].outcomesProbability.map((value, index) => {
              return (
                <TooltipContent
                  key={index}
                  active
                  value={value}
                  unit={unit}
                  decimals={decimals}
                />
              );
            })}
        </div>
      )}
    </div>
  );
};

export default Graph;
