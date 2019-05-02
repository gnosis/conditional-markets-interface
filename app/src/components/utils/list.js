import React from "react";

const reactJoinArray = (array, glue) => (
  <>
    {array.map((element, index) => (
      <span key={index}>
        {element} {index < array.length - 1 && glue}
      </span>
    ))}
  </>
);

export const arrayToHumanReadableList = (array, glue = "and") => {
  return <span>{reactJoinArray(array, <strong> {glue} </strong>)}</span>;
};
