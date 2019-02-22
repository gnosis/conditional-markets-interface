import React from 'react'
import classnames from 'classnames/bind'

import style from './style.scss'

const cx = classnames.bind(style)

const BuySection = ({ handleBuyOutcomes, handleSelectInvest, invest, selectionPrice, validPosition }) => (
  <div className={cx('positions')}>
    <input
      type="text"
      placeholder="Amount of shares to buy"
      value={invest}
      onChange={handleSelectInvest}
    />
    {validPosition && <p>The selected positions will cost <strong>{selectionPrice.toFixed(6)} &Xi;</strong> per share.</p>}
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
  selectionPrice: 0
}

export default BuySection