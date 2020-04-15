import React, { useCallback } from "react";
import cn from "classnames/bind";

import style from "./transactions.scss";
import Button from "@material-ui/core/Button";
import Spinner from "components/Spinner"

const cx = cn.bind(style);

const Transaction = ({ number, name, description, approved, enabled, submitTx }) => {
  const handleSubmit = useCallback(() => {
    submitTx(index);
  }, []);

  return (
    <div className={cx("tx-entry", { approved }, { disabled: !enabled })}>
      <h1>
        {number}. {name}
      </h1>
      <p>{description}</p>
      <Button
        className={cx("material-button")}
        classes={{ label: cx("material-button-label") }}
        type="button"
        variant="contained"
        color="primary"
        size="large"
        disabled={!enabled || approved}
        onClick={handleSubmit}
      >
        {approved ? <Spinner width={12} height={12} /> : "Submit"}
      </Button>
    </div>
  );
};

export default Transaction;
