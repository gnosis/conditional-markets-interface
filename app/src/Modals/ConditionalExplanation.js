import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import Explanation from "assets/img/conditional-explanation.png";

import style from "./conditionalExplanation.scss";

const cx = cn.bind(style);

const ConditionalExplanation = ({ closeModal }) => {
  return (
    <div className={cx("modal")}>
      <div className={cx("modal-header")}>
        <a href="#" className={cx("modal-close")} onClick={closeModal}>
        </a>{" "}
        What is a conditional market?
      </div>
      <div className={cx("modal-body")}>
        <img
          className={cx("explanation-img")}
          src={Explanation}
          alt="Explanation of how a conditional market refunds your invest, if you made your prediction dependant on another outcome."
        />
        <p>
          Conditional markets allow you to invest in markets, on a certain
          conditional outcome of one or more other markets.
        </p>
        <p>
          When the outcome(s) of conditional markets in the end are not met,
          you&apos;ll receive a refund.
        </p>
        <p><strong>
          Enable the &apos;conditional&apos; toggle on the market that you want
          your other trades to depend on.</strong>
        </p>
      </div>
    </div>
  );
};

ConditionalExplanation.propTypes = {
  closeModal: PropTypes.func.isRequired
};

export default ConditionalExplanation;
