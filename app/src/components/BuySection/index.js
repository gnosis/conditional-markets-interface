import React from 'react'
import classnames from 'classnames/bind'

import style from './style.scss'

const cx = classnames.bind(style)

const BuySection = ({ handleBuyOutcomes, handleSelectInvest, invest, outcomesToBuy }) => (
  <div className={cx('positions')}>
    <input
      type="text"
      placeholder="Amount of shares to buy"
      value={invest}
      onChange={handleSelectInvest}
    />
    {outcomesToBuy.join(', ')}
    <button
      type="button"
      onClick={handleBuyOutcomes}
    >
      Buy
    </button>
  </div>
)

BuySection.defaultProps = {
  invest: '',
  outcomesToBuy: []
}

export default BuySection