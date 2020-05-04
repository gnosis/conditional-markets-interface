import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import style from "./transactions.scss";
import TitleBar from "../components/upperBar";
import Account from "./Account";
import Transaction from "./Transaction";

const cx = cn.bind(style);

const Transactions = ({ closeModal, title, transactions }) => {
  const [currentTxIndex, setCurrentTxIndex] = useState(0);

  const executeTx = useCallback(
    index => {
      return (async () => {
        {
          await transactions[index].execute();
          setCurrentTxIndex(currentTxIndex + 1);

          if (currentTxIndex === transactions.length - 1) {
            closeModal();
          }
        }
      })();
    },
    [currentTxIndex, transactions]
  );

  return (
    <div className={cx("tx-modal")}>
      <TitleBar title={title} closeModal={closeModal} />
      <div className={cx("tx-subheader")}>
        <Account />
        <div className={cx("tx-description")}>
          Setup your account to allow for a smooth transaction experience. Each
          action will trigger a transaction in your client which you&apos;ll
          have to confirm. This only has to be done once.
        </div>
      </div>
      <div className={cx("tx-content")}>
        {transactions.map(({ name, description }, index) => (
          <Transaction
            key={`${index}-${name.substr(0, 20)}`}
            index={index}
            name={name}
            enabled={currentTxIndex >= index}
            number={index + 1}
            description={description}
            submitTx={executeTx}
          />
        ))}
      </div>
    </div>
  );
};

Transactions.defaultProps = {
  title: "Setup Account"
};

Transactions.propTypes = {
  title: PropTypes.node,
  transactions: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      description: PropTypes.string,
      execute: PropTypes.func
    })
  ).isRequired
};

export default Transactions;
