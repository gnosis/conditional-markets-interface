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
ReasonNationality.propTypes = {
  person: PropTypes.shape({
    nationalityName: PropTypes.string
  }).isRequired
};

const ReasonTierOneCheck = () => (
  <>
    <div className={cx("modal-heading")}>Application rejected.</div>
    <span>
      The personal details submitted were matched against a name on a sanction
      list.
    </span>
    <br />
    <br />
    <span>
      If you believe this to be a mistake, please contact{" "}
      <a
        href="mailto:compliance@sight.pm"
        target="_BLANK"
        rel="noreferrer noopener"
      >
        compliance@sight.pm
      </a>
    </span>
    <br />
  </>
);

const REASON_COMPONENTS = {
  unknown: function ReasonUnknown() {
    return <span>You may not join Sight at this time.</span>;
  },
  "nationality-rejected": ReasonNationality,
  tier1check: ReasonTierOneCheck
};

const Rejected = props => {
  const { closeModal, reason } = props;

  let TargetComponent = REASON_COMPONENTS["unknown"];

  if (Object.keys(REASON_COMPONENTS).indexOf(reason) > -1) {
    TargetComponent = REASON_COMPONENTS[reason];
  }

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
  reason: PropTypes.string,
  person: PropTypes.shape({
    nationalityName: PropTypes.string
  })
};

Rejected.defaultProps = {
  reason: "unknown",
  person: null
};

export default Rejected;
