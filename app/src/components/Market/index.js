import React from 'react'
import PropTypes from 'prop-types'
import Outcome from '../Outcome'
import cn from 'classnames/bind'

import css from './style.scss'

const cx = cn.bind(css)

const Market = ({ title, description, outcomes, conditionId }) => {
  return (
    <div className={cx('market')}>
      <h1 className={cx('title')}>{title}</h1>
      <p>{description}</p>
      {outcomes.map((outcome, index) => (
        <Outcome key={index} {...outcome} />
      ))}
    </div>
  )
}

Market.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  outcomes: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    probability: PropTypes.number,
    price: PropTypes.number,
  }))
}

export default Market