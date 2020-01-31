import React from "react";

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

export default CursorWithLineConnection;
