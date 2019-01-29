import React from 'react'

import { loadContract, getDefaultAccount } from '../../api/web3'
import { compose, lifecycle, withState } from 'recompose'
import cn from 'classnames/bind'

import css from './style.scss'

const cx = cn.bind(css)

const disableButton = (e) => e.preventDefault()

const Outcome = ({ name, probability, color, price, positionId, isDisabled, isSelected, isCorrect, onSelectOutcome, balance}) => (
  <div className={cx('outcome', { selected: isSelected, correct: isCorrect, disabled: isDisabled })} style={{ width: `${probability * 100}%` }}>
    <button
      className={cx('bar')}
      disabled={isDisabled}
      onClick={isDisabled ? disableButton : onSelectOutcome}
      type="button"
    >
      <div
        title={`${balance} Tokens @ ${positionId}`}
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

Outcome.defaultProps = {
  balance: '0'
}

const enhancer = compose(
  withState('balance', 'setBalance', '0'),
  lifecycle({
    async componentDidMount() {
      const { positionId, setBalance } = this.props

      const pmSystem = await loadContract('PredictionMarketSystem')
      const account = await getDefaultAccount()
      
      const balance = await pmSystem.balanceOf(account, positionId)
      setBalance(balance.toString())
    }
  })
)

export default enhancer(Outcome)