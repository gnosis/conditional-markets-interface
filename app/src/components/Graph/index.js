import React, { useEffect, useState, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { formatDate, getMoment } from "utils/timeFormat";
import cn from "classnames/bind";

import CursorWithLineConnection from "./CursorWithLineConnection";
import TooltipContent from "./TooltipContent";

import styles from "./Graph.scss";

import { blueColor, redColor } from "scss/_variables.scss";
import CheckSvg from "assets/icons/check-circle-green.svg";

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
  ReferenceDot,
  ReferenceLine
} from "recharts";

const cx = cn.bind(styles);

const CHECK_ICON_RADIUS = 10;
const CheckIcon = ({ viewBox: { x, y } }) => {
  return (
    <g
      transform={`translate(${x + CHECK_ICON_RADIUS / 2}, ${y +
        CHECK_ICON_RADIUS / 2})`}
    >
      <circle r={CHECK_ICON_RADIUS} fill="white" />
      <image
        x={-CHECK_ICON_RADIUS}
        y={-CHECK_ICON_RADIUS}
        href={CheckSvg}
        height={CHECK_ICON_RADIUS * 2}
        width={CHECK_ICON_RADIUS * 2}
      />
    </g>
  );
};
CheckIcon.propTypes = {
  viewBox: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number
  }).isRequired
};

const PositionMarker = ({ x, viewBox, setWinningOutcomeLabelPos }) => {
  /**
   * Is unfortunately required to correctly get the position of the ReferenceLine in order to align
   * the tooltip and the line connecting the tooltip and the ReferenceLine.
   */
  const pos = {
    x: x,
    y: viewBox.y
  };

  useEffect(() => {
    setWinningOutcomeLabelPos(pos);
  }, []);

  return null;
};
PositionMarker.propTypes = {
  x: PropTypes.number.isRequired,
  viewBox: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number
  }).isRequired,
  setWinningOutcomeLabelPos: PropTypes.func.isRequired
};

const Graph = ({
  lowerBound,
  upperBound,
  decimals,
  unit,
  created,
  resolutionDate,
  resolutionValue,
  marketType,
  entries,
  currentProbability
}) => {
  //const [decimals, setDecimals] = useState(parentDecimals || 2);

  const [data, setData] = useState(entries);
  const [sidebarWidth, setSidebarWidth] = useState(0);

  const [tooltipPosition, setTooltipPosition] = useState(null);
  const [lastTickPosition, setLastTickPosition] = useState(null);
  const [winningOutcomeLabelPos, setWinningOutcomeLabelPos] = useState(null);

  const lineRef = useRef(null);
  const lineChartRef = useRef(null);
  const winningOutcomeRef = useRef(null);

  useEffect(() => {
    // console.log("memo updates", entries, currentProbability)
    // TODO entries and currentProbability are constantly updating. As data
    // object is updated each render the graph is re-rendered continously.
    // Check how to cache entries and current probability to avoid components
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

    // Get initial probability for market
    const getInitialProbability = () => {
      const midValue =
        (parseFloat(upperBound) - parseFloat(lowerBound)) / 2 +
        parseFloat(lowerBound);

      return currentProbability.map(() => {
        return midValue;
      });
    };

    // when new entries are added, or the probability of the selected outcome changes
    if (entries.length >= data.length || currentProbabilityChanged()) {
      const initialOutcomesProbability = getInitialProbability();
      const newData = [
        {
          outcomesProbability: initialOutcomesProbability,
          date: getMoment(created).valueOf(),
          // FIXME First entry in `entries` comes with index 0 and we add this one also
          // with the same index. Is not critical but it's a bug
          index: 0
        },
        ...entries
      ];

      // Logic to add last entry if necessary
      const lastEntry = entries[entries.length - 1];
      const noTrades = entries.length === 0;

      const isBeforeResolutionDate = getMoment(resolutionDate).isAfter(
        getMoment()
      );

      const isLastEntryBeforeResolutionDate =
        !noTrades &&
        getMoment(lastEntry.date).isBefore(getMoment(resolutionDate));

      if (
        isBeforeResolutionDate ||
        noTrades ||
        isLastEntryBeforeResolutionDate
      ) {
        // Only add last entry (with current probabilities) if the market is not already resolved.
        // When market is resolved, if latest trade is before selected resolution date, duplicate latest trade
        // but adjust to show on resolution date (in some special cases there can be trades a bit after resolution date)
        const newEntry = isBeforeResolutionDate
          ? {
              outcomesProbability: currentProbability,
              date: getMoment().valueOf()
            }
          : {
              outcomesProbability: noTrades
                ? initialOutcomesProbability
                : lastEntry.outcomesProbability,
              date: getMoment(resolutionDate).valueOf()
            };
        newData.push({
          ...newEntry,
          index: entries.length + 1 // +1 because we add the market creation as a datapoint
        });
      }

      setData(newData);
    }
  }, [entries, currentProbability]);

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
    return formatDate(tick, "MMM D");
  });

  const formatDateTickTooltip = useCallback(tick => {
    return formatDate(tick, "MMM D HH:mm");
  });

  const marketClass = marketType.toLowerCase() + "-graph";

  // Create date ticks manually. Use daily pattern (X Axis ticks)
  const getTicks = useCallback(() => {
    let range = [];
    if (data && data[0]) {
      const startDate = getMoment(data[0].date).startOf("day");
      const endDate = getMoment(data[data.length - 1].date).endOf("day");
      while (startDate < endDate) {
        range.push(getMoment(startDate));
        startDate.add(1, "days");
      }
      range.push(endDate);
    }
    return range;
  }, [data]);

  const ticks = getTicks();
  return (
    <div className={cx("graph-container", marketClass)}>
      <ResponsiveContainer minHeight={300} minWidth="100%">
        <LineChart data={data} onMouseMove={mouseUpdate} ref={lineChartRef}>
          {marketType !== "SCALAR" && (
            <Tooltip
              labelFormatter={formatDateTickTooltip}
              formatter={value => {
                return [value.toFixed(2) + "%"];
              }}
            />
          )}
          {tooltipPosition && marketType === "SCALAR" && (
            <Tooltip
              cursor={
                <CursorWithLineConnection
                  currentPositionTooltipCoordinates={lastTickPosition}
                  selectedPositionTooltipCoordinates={tooltipPosition}
                />
              }
              coordinate={{ x: 0, y: 0 }}
              wrapperStyle={{ zIndex: 100, background: "white", top: "-10px" }}
              position={{ x: -sidebarWidth, y: tooltipPosition.y }}
              content={<TooltipContent unit={unit} decimals={decimals} />}
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
            minTickGap={20}
            type="number"
            scale="time"
            ticks={ticks}
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
                  type="stepAfter"
                  dataKey={dataKey}
                  stroke={stroke}
                  ref={lineRef}
                />
              );
            })}
          {resolutionValue && lastTickPosition && (
            /* only scalar has resolution value on graph */
            <ReferenceLine
              key="resolution-value"
              stroke="#16ae60"
              y={resolutionValue}
              ref={winningOutcomeRef}
              label={
                <PositionMarker
                  x={lastTickPosition.x}
                  setWinningOutcomeLabelPos={setWinningOutcomeLabelPos}
                />
              }
            />
          )}
          {resolutionValue && lastTickPosition && (
            /* only scalar has resolution value on graph */
            <ReferenceDot
              key="resolution-value-dot"
              r={5}
              fill="none"
              stroke="none"
              y={resolutionValue}
              x={data[data.length - 1].date}
              label={<CheckIcon />}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      {lastTickPosition && marketType === "SCALAR" && (
        <div
          className={cx("tooltip-current-position")}
          style={{
            transform: `translate(${-sidebarWidth}px, calc(${
              lastTickPosition.y
            }px - 50%))`
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
      {winningOutcomeLabelPos && (
        <div
          className={cx("tooltip-winning-outcome")}
          style={{
            transform: `translate(${-sidebarWidth}px, calc(${
              winningOutcomeLabelPos.y
            }px - 50%))`
          }}
        >
          <TooltipContent
            key="resolution-value"
            active
            value={resolutionValue}
            unit={unit}
            decimals={decimals}
          />
        </div>
      )}
    </div>
  );
};

Graph.propTypes = {
  lowerBound: PropTypes.string.isRequired,
  upperBound: PropTypes.string.isRequired,
  entries: PropTypes.array,
  currentProbability: PropTypes.array,
  marketType: PropTypes.string.isRequired,
  resolutionDate: PropTypes.string.isRequired,
  resolutionValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  created: PropTypes.string.isRequired,
  decimals: PropTypes.number,
  unit: PropTypes.string
};

Graph.defaultProps = {
  resolutionValue: null,
  unit: "Units",
  decimals: 2
};

export default Graph;
