import React from 'react'
import classnames from 'classnames/bind'
import Decimal from 'decimal.js'

import style from './style.scss'

const cx = classnames.bind(style)

const BuySection = ({ handleBuyOutcomes, handleSelectInvest, invest, selectionPrice, validPosition, outcomeTokenBuyAmounts }) => (
  <div className={cx('positions')}>
    <input
      type="text"
      placeholder="Your Invest in ETH"
      value={invest}
      onChange={handleSelectInvest}
    />
    <button
      type="button"
      disabled={!validPosition}
      onClick={handleBuyOutcomes}
    >
      Buy
    </button>
  </div>
)

BuySection.defaultProps = {
  invest: '',
  selectionPrice: 0,
  outcomeTokenBuyAmounts: []
}

export default BuySection