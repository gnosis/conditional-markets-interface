import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";

import EmoteSad from "assets/img/emote_sad.svg";

import style from "../kyc.scss";

const cx = cn.bind(style);

const ReasonNationality = ({ person }) => (
  <>
    <span>
      Unfortunately, you may not onboard at Sight at this present moment, due to
      your selected nationality:
    </span>
    <br />
    <strong>{person.nationalityName}</strong>
    <br />
    <br />
    <span>
      View our list of{" "}
      <a target="_BLANK" rel="noreferrer nofollow">
        restricted countries
      </a>{" "}
      for more information.
    </span>
  </>
);

const REASON_COMPONENTS = {
  unknown: () => <span>You may not join Sight at this time.</span>,
  "nationality-rejected": ReasonNationality
};

const Rejected = props => {
  const { closeModal, reason } = props;

  const TargetComponent = REASON_COMPONENTS["nationality-rejected"];

  return (
    <>
      <div className={cx("modal-header")}>
        Create account
        <button
          type="button"
          onClick={closeModal}
          className={cx("modal-close")}
        />
      </div>
      <div className={cx("modal-body")}>
        <div className={cx("modal-textblock")}>
          <img className={cx("modal-jumbo")} src={EmoteSad} alt="Sorry! :(" />
          <TargetComponent {...props} />
        </div>
        <div>
          <button
            className={cx("field", "button", "primary")}
            onClick={closeModal}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

Rejected.propTypes = {
  closeModal: PropTypes.func.isRequired,
  reason: PropTypes.string
};

Rejected.defaultProps = {
  reason: "unknown"
};

export default Rejected;
