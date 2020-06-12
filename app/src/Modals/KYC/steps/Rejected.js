import React from "react";
import PropTypes from "prop-types";
import cn from "classnames/bind";
import Button from "@material-ui/core/Button";

import UpperBar from "../../components/upperBar";

import EmoteSad from "assets/img/emote_sad.svg";

import style from "../kyc.scss";

const cx = cn.bind(style);

const ReasonNationality = ({ person }) => (
  <>
    <span>
      Unfortunately there are some nationalities which may not get access to
      Sight. This has nothing to do with you personally, but rather Sight
      avoiding the risk that the nation you belong to would take legal action
      against us.
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
    <div className={cx("modal-heading")}>Verification Failed</div>
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
      <UpperBar closeModal={closeModal} title="Verification Failed"></UpperBar>
      <div className={cx("modal-body")}>
        <div className={cx("modal-textblock")}>
          <img className={cx("modal-jumbo")} src={EmoteSad} alt="Sorry! :(" />
          <TargetComponent {...props} />
        </div>
        <div>
          <Button
            className={cx("material-button")}
            classes={{ label: cx("material-button-label") }}
            variant="contained"
            color="primary"
            size="large"
            onClick={closeModal}
          >
            Close
          </Button>
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
