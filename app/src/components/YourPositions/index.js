import React from 'react'

const YourPositions = ({ positions }) => (
  <div>
    <h2>Positions</h2>
    {!positions && <em>You don't hold any positions yet.</em>}
    {positions.map((position, index) => (
      <div key={index}>
        {position}
      </div>
    ))}
  </div>
)

export default YourPositions;