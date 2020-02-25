import React, { useCallback, useState } from "react";
import classnames from "classnames/bind";
import style from "../kyc.scss";

import EmotePending from "assets/img/emote_pending.svg";

const cx = classnames.bind(style);

const Pending = ({ closeModal, handleAdvanceStep }) => {
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
        <div className={cx("modal-textblock")}>
          <img
            className={cx("modal-jumbo")}
            src={EmotePending}
            alt="Pending Verification"
          />
        </div>
        <div>
          <div className={cx("modal-heading")}>
            Account creation in process...
          </div>

          <div className={cx("modal-well")}>
            <ul className={cx("checklist")}>
              <li className={cx({ check: checkedIndices[0] })}>
                Checking information against sanction list (~5 minutes)
              </li>
              <li className={cx({ check: checkedIndices[1] })}>
                Adding address to whitelist (~5 minutes)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pending;
