import React from 'react'
import classnames from 'classnames/bind'

import style from './style.scss'

const cx = classnames.bind(style)

const BuySection = ({ handleBuyOutcomes, handleSelectInvest, invest }) => (
  <div className={cx('positions')}>
    <input
      type="text"
      placeholder="Amount of shares to buy"
      value={invest}
      onChange={handleSelectInvest}
    />
    <button
      type="button"
      onClick={handleBuyOutcomes}
    >
      Buy
    </button>
  </div>
)

BuySection.defaultProps = {
  invest: ''
}

export default BuySection