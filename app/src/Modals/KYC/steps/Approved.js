import React, { useCallback, useState } from "react";
import classnames from "classnames/bind";
import style from "../kyc.scss";

import EmotePending from "assets/img/emote_approve.svg";

const cx = classnames.bind(style);

const Approved = ({ closeModal, handleAdvanceStep }) => {
  const [checkedIndices, setCheckedIndicies] = useState([false, false]);

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
                <div className={cx("value")}>0x123434343</div>
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

          <button
            className={cx("field", "button", "primary")}
            type="button"
            onClick={closeModal}
          >
            Continue Trading
          </button>
        </div>
      </div>
    </>
  );
};

export default Approved;
