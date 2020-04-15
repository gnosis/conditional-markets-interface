import React from "react";
import cn from "classnames/bind";

import style from "./transactions.scss";
import TitleBar from "../components/upperBar";
import Account from "./Account";
import Transaction from "./Transaction";

const cx = cn.bind(style);

const Transactions = ({ closeModal, title }) => {
  const TXs = [
    {
      name: "Set Allowance",
      description:
        "This permission allows Sight to interact with your DAI. This has to be done only once for each collateral type."
    },
    {
      name: "Buy Position",
      description:
        "Allowance is now set. You can now submit your selected buy position."
    }
  ];

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
        {TXs.map(({ name, description }, index) => (
          <Transaction
            key={`${index}-${name.substr(0, 20)}`}
            name={name}
            number={index + 1}
            description={description}
          />
        ))}
      </div>
    </div>
  );
};

Transactions.defaultProps = {
  title: "Setup Account"
};

export default Transactions;
