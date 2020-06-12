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

  const [pendingTxIndex, setPendingTxIndex] = useState(null);

  return (
    <div className={cx("tx-modal")}>
      <TitleBar
        title="First Transaction"
        closeModal={closeModal}
        disableClose={pendingTxIndex != null}
      />
      <div className={cx("tx-subheader")}>
        <Account />
        <div className={cx("tx-description")}>
          Sight is built on the Ethereum blockchain. Every market has its own
          market maker. The code which runs the market market maker is on the
          ethereum blockchain. When interacting with the market maker for the
          first time we need to do the following:
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
            setPending={active => setPendingTxIndex(active ? index : null)}
            pending={pendingTxIndex == index}
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
