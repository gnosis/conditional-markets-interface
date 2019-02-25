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
    {validPosition && <p>The selected positions will cost <strong>{selectionPrice.toFixed(6)} &Xi;</strong> per share.</p>}
    {!isNaN(parseFloat(invest)) && <p>{outcomeTokenBuyAmounts.reduce((acc, numShares) => acc.plus(new Decimal(numShares)), new Decimal(0)).dividedBy(new Decimal(10).pow(18)).toSD(8).toString()} shares can be bought with your invest</p>}
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