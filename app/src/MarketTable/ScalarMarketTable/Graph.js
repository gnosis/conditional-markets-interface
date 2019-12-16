import React, { useEffect, useState, useCallback, useRef } from "react";
import moment from "moment";
import { formatScalarValue } from "utils/formatting";
import cn from "classnames/bind";

import styles from "./Graph.scss";

import {
  LineChart,
  XAxis,
  YAxis,
  Line,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Text
} from "recharts";

const cx = cn.bind(styles);

const CursorWithLineConnection = props => {
  //console.log(props);
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

const TooltipContent = ({ active, payload, unit, decimals }) => {
  if (active) {
    return (
      <div className={cx("tooltip-inner")}>
        {formatScalarValue(payload[0].value, unit, decimals)}
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
  currentProbability
}) => {
  const [decimals, setDecimals] = useState(parentDecimals || 2);

  const [data, setData] = useState(entries);
  const [sidebarWidth, setSidebarWidth] = useState(0);

  const [tooltipPosition, setTooltipPosition] = useState(null);
  const [lastTickPosition, setLastTickPosition] = useState(null);

  const lineRef = useRef(null);
  const lineChartRef = useRef(null);

  useEffect(() => {
    const newData = [
      ...entries,
      {
        value: currentProbability
          .mul(upperBound - lowerBound)
          .add(lowerBound)
          .toNumber(),
        date: +new Date(),
        index: entries.length
      }
    ];

    setData(newData);
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

    if (lineChartRef.current && lineRef.current) {
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

  const LineTickWithTitle = useCallback(
    props => {
      const { x, y, payload } = props;

      let tickLabel = null;
      let tickTitle = null;
      if (lineRef.current) {
        const tickDate = moment(
          lineRef.current.props.points[payload.value].payload.date
        );
        tickLabel = (
          <>
            <tspan x={0}>{tickDate.format("MMM D")}</tspan>
            <tspan x={0} dy={20}>{tickDate.format("HH:mm")}</tspan>
          </>
        );
        tickTitle = tickDate.format("LLL");
      }

      return (
        <g transform={`translate(${x},${y})`}>
          {tickLabel && (
            <text x={0} y={0} fill="#666" textAnchor="middle" dy="0.71em">
              {tickLabel}
              <title>{tickTitle}</title>
            </text>
          )}
        </g>
      );
    },
    [lineRef.current]
  );

  if (data.length <= 2) {
    return (
      <div className={cx("graph-container", "empty")}>
        <span>No data yet.</span>
      </div>
    );
  }

  return (
    <div className={cx("graph-container")}>
      <ResponsiveContainer minHeight={300}>
        <LineChart data={data} onMouseMove={mouseUpdate} ref={lineChartRef}>
          {tooltipPosition && (
            <Tooltip
              //cursor={{ stroke: "#02ae60", strokeWidth: 2 }}
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
          <Line
            type="stepBefore"
            dataKey="value"
            stroke="#8884d8"
            ref={lineRef}
          />
          <ReferenceDot
            x={data[data.length - 1].date}
            y={data[data.length - 1].value}
            r={0}
            fill="red"
            stroke="none"
          />
          <XAxis
            dataKey="index"
            domain={[data && data[0] ? data[0].date : 0, "dataMax"]}
            tick={<LineTickWithTitle />}
            interval="preserveEnd"
          />
          <YAxis
            orientation="right"
            type="number"
            domain={[parseFloat(lowerBound), parseFloat(upperBound)]}
          />
        </LineChart>
      </ResponsiveContainer>
      {lastTickPosition && (
        <div
          className={cx("tooltip-current-position")}
          style={{
            transform: `translate(${-sidebarWidth}px, ${lastTickPosition.y}px)`
          }}
        >
          <TooltipContent
            active
            payload={[data[data.length - 1]]}
            unit={unit}
            decimals={decimals}
          />
        </div>
      )}
    </div>
  );
};

export default Graph;
