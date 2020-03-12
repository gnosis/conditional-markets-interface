import React from "react";
import PropTypes from "prop-types";
import classnames from "classnames/bind";
import Button from "@material-ui/core/Button";

import style from "../kyc.scss";

import UpperBar from "../../components/upperBar";

import EmotePending from "assets/img/emote_approve.svg";

const cx = classnames.bind(style);
import useGlobalState from "hooks/useGlobalState";

const Approved = ({ closeModal }) => {
  const { account } = useGlobalState();
  return (
    <>
      <UpperBar closeModal={closeModal} title="Create Account"></UpperBar>
      <div className={cx("modal-body")}>
        <img
          className={cx("modal-jumbo")}
          src={EmotePending}
          alt="Pending Verification"
        />
        <div>
          <div className={cx("modal-heading")}>Application approved!</div>

          <div className={cx("modal-well")}>
            <div className={cx("connected-items")}>
              <div className={cx("entry")}>
                <div className={cx("label")}>Wallet Address</div>
                <div className={cx("dots")} />
                <div className={cx("value")}>{account}</div>
              </div>
              <div className={cx("entry")}>
                <div className={cx("label")}>Tier Level</div>
                <div className={cx("dots")} />
                <div className={cx("value")}>1</div>
              </div>
              <div className={cx("entry")}>
                <div className={cx("label")}>Available trade limit</div>
                <div className={cx("dots")} />
                <div className={cx("value")}>
                  €0 / <strong>€150</strong>
                </div>
              </div>
            </div>
          </div>

          <div className={cx("modal-textblock")}>
            <p>
              Your application has been approved and you&apos;ve been upgraded
              to <strong>Tier 1</strong>. You may now buy outcome tokens with a
              value up to 150€
            </p>
            <p>
              We&apos;ve sent you an e-mail to subscribe to Sight notifications
              to receive updates about new markets and news.
            </p>
          </div>
          <Button
            className={cx("material-button")}
            classes={{ label: cx("material-button-label") }}
            variant="contained"
            color="primary"
            size="large"
            onClick={closeModal}
          >
            Continue Trading
          </Button>
        </div>
      </div>
    </>
  );
};

Approved.propTypes = {
  closeModal: PropTypes.func.isRequired
};

export default Approved;
