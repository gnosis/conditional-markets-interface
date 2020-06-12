import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import style from "./transactions.scss";
import Button from "@material-ui/core/Button";
import Spinner from "components/Spinner";

const cx = cn.bind(style);

const NOOP = () => {};

const Transaction = ({
  index,
  name,
  description,
  enabled,
  submitTx,
  setPending,
  pending
}) => {
  //const [pending, setPending] = useState(false);
  const [wasCompleted, setWasCompleted] = useState(false);
  const handleSubmit = useCallback(() => {
    (async () => {
      setPending(true);
      try {
        await submitTx(index);
        setWasCompleted(true);
      } finally {
        // don't catch, but always unset pending
        setPending(false);
      }
    })();
  }, [index, setPending, submitTx]);

  let buttonInner = "Submit";

  if (pending) {
    buttonInner = (
      <>
        {/* Avoids button collapse, sorry */}
        &nbsp;
        <Spinner width={38} height={38} absolute />
      </>
    );
  }

  if (wasCompleted) {
    buttonInner = "Approved";
  }

  return (
    <div className={cx("tx-entry", { disabled: !enabled })}>
      <h1>
        {index + 1}. {name}
      </h1>
      <p>{description}</p>
      <Button
        className={cx("material-button", { completed: wasCompleted })}
        classes={{ label: cx("material-button-label") }}
        type="button"
        variant="contained"
        color={wasCompleted ? "" : "primary"}
        size="large"
        disabled={!enabled || wasCompleted}
        disableRipple={!enabled || pending}
        onClick={!enabled || pending ? NOOP : handleSubmit}
      >
        {buttonInner}
      </Button>
    </div>
  );
};

Transaction.propTypes = {
  index: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  submitTx: PropTypes.func.isRequired,
  enabled: PropTypes.bool.isRequired,
  pending: PropTypes.bool.isRequired,
  setPending: PropTypes.func.isRequired,
};

Transaction.defaultProps = {
  description:
    "You have to approve this transaction before you can complete your trade."
};

export default Transaction;
