import React from 'react'
import cn from 'classnames/bind'

import style from './style.scss'

const cx = cn.bind(style)

const MarketAssumption = ({ title, description, outcomes, conditionId, onSelectAssumption, assumption }) => (
  <div className={cx('market')}>
    <h1 className={cx('title')}>{title}</h1>
    <p>{description}</p>
    <div className={cx('assumptions')}>
      {outcomes.map((outcome, index) => (
        <label key={outcome.name} className={cx('assumption')}>
          <input type="radio" value={index} checked={assumption === index.toString()} name={`assumptions[${conditionId}]`} onChange={onSelectAssumption} />
          <span>{outcome.name}</span>
        </label>
      ))}
      <label className={cx('assumption')}>
        <input type="radio" checked={!assumption} value={"none"} name={`assumptions[${conditionId}]`} onChange={onSelectAssumption} />
        <span>Don't know</span>
      </label>
    </div>
  </div>
)

export default MarketAssumption