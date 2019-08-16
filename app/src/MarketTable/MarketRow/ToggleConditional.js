import React, { useCallback } from "react";
import cn from "classnames/bind";

import style from "./toggleConditional.scss";

const cx = cn.bind(style);

const ToggleConditional = ({
  conditionId,
  conditionalActive,
  toggleConditional
}) => {
  const toggle = useCallback(e => {
    toggleConditional(e.target.checked);
  }, []);
  return (
    <div className={cx("conditional")}>
      {conditionalActive}
      <input
        type="checkbox"
        id={`${conditionId}-conditional-toggle`}
        onChange={toggle}
        checked={conditionalActive}
      />
      <label htmlFor={`${conditionId}-conditional-toggle`}>Toggle</label>
    </div>
  );
};

export default ToggleConditional;
