import React, { useEffect, useState } from "react";
import { formatDate, getMoment } from "utils/timeFormat";

import {
  LineChart,
  XAxis,
  YAxis,
  Line,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const formatDateTick = tick => {
  return formatDate(tick, "MMM D");
};

const makeMockData = (min, max) => {
  const totalElements = 20;
  return Array(totalElements)
    .fill(null)
    .map((_, i) => {
      const date = getMoment()
        .subtract(totalElements - i, "days")
        .valueOf();
      const value = Math.random() * max + min;

      return {
        name: formatDateTick(date),
        date: date,
        value: value
      };
    });
};

const graph = ({ lowerBound, upperBound, decimals, unit, lmsrAddress }) => {
  const [data, setData] = useState([]);
  useEffect(() => {
    setData(makeMockData(lowerBound, upperBound));
  }, [lowerBound, upperBound]);

  return (
    <ResponsiveContainer minHeight={300}>
      <LineChart data={data}>
        <Tooltip cursor={{ stroke: "#02ae60", strokeWidth: 2 }} />
        <XAxis
          dataKey="name"
          // domain={[data && data[0] ? data[0].date : 0, "auto"]}
          // type="number"
          // tickFormatter={formatDateTick}
          interval="preserveEnd"
        />
        <YAxis orientation="right" domain={[lowerBound, upperBound]} />
        <Line type="stepBefore" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default graph;
