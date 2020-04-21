import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import style from "./transactions.scss";
import Button from "@material-ui/core/Button";
import Spinner from "components/Spinner";

const cx = cn.bind(style);

const Transaction = ({ index, name, description, enabled, submitTx }) => {
  const [pending, setPending] = useState(false);
  const handleSubmit = useCallback(() => {
    (async () => {
      setPending(true);
      await submitTx(index);
      setPending(false);
    })();
  }, [index, setPending]);

  return (
    <div className={cx("tx-entry", { disabled: !enabled })}>
      <h1>
        {index + 1}. {name}
      </h1>
      <p>{description}</p>
      <Button
        className={cx("material-button")}
        classes={{ label: cx("material-button-label") }}
        type="button"
        variant="contained"
        color="primary"
        size="large"
        disabled={!enabled || pending}
        onClick={handleSubmit}
      >
        {pending ? <Spinner width={12} height={12} /> : "Submit"}
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
};

Transaction.defaultProps = {
  description:
    "You have to approve this transaction before you can complete your trade."
};

export default Transaction;
