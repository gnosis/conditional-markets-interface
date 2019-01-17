import React from 'react'
import cn from 'classnames/bind'

import css from './style.scss'

const cx = cn.bind(css)

const Outcome = ({ name, probability, price }) => (
  <div>
    <p>{name}</p>
    <div className={cx('bar')}>
      <div className={cx('inner')} style={{ width: `${probability * 100}%` }}>
        <div className={cx('hint')}>
          <span className={cx('text')}>
            {(probability * 100).toFixed(2)} %
          </span>
        </div>
      </div>
    </div>
  </div>
)

export default Outcome