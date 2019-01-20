import React from 'react'
import web3 from 'web3'
import { loadContract, getDefaultAccount } from '../../api/web3'
import { compose, lifecycle, withState } from 'recompose'
import cn from 'classnames/bind'

import css from './style.scss'

const cx = cn.bind(css)
const { BN } = web3.utils

const Outcome = ({ name, probability, color, price, positionId, isSelected, onSelectOutcome, balances}) => (
  <div className={cx('outcome')} style={{ width: `${probability * 100}%` }}>
    <button
      className={cx('bar', { selected: isSelected })}
      onClick={onSelectOutcome}
      type="button"
    >
      <div
        title={`${balances[positionId] || "0"} Tokens @ ${positionId}`}
        className={cx('inner')}
        style={{ backgroundColor: color, borderColor: color }}
      >
        <div className={cx('hint')}>
          <span className={cx('text')}>
            {(probability * 100).toFixed(2)} %
          </span>
        </div>
      </div>
    </button>
  </div>
)

const enhancer = compose(
  withState('balance', 'setBalance', '0'),
  lifecycle({
    async componentDidMount() {
      const { positionId, setBalance } = this.props

      const pmSystem = await loadContract('PredictionMarketSystem')
      const account = await getDefaultAccount()
      
      const balance = await pmSystem.balanceOf(account, positionId)
      console.log({ balance: balance.toString() })
      setBalance(balance.toString())
    }
  })
)

export default enhancer(Outcome)