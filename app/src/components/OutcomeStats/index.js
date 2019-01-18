import React from 'react'
import cn from 'classnames/bind'

import css from './style.scss'

import { formatEther } from './utils/numberFormat'


const cx = cn.bind(css)

const OutcomeStats = ({ name, price, isSelected }) => (
  <div className={cx('outcome-stat', { selected: isSelected })}>
    <p className={cx('name')}>{name}</p>
    <dl className={cx('stats')}>
      <dt>Price</dt>
      <dd>{formatEther(price)}</dd>
      <dt>Your Balance</dt>
      <dd>0 Outcome Tokens</dd>
    </dl>
  </div>
)

export default OutcomeStats