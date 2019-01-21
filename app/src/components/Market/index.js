import React from 'react'
import PropTypes from 'prop-types'
import Outcome from '../Outcome'
import OutcomeStats from '../OutcomeStats'
import cn from 'classnames/bind'

import css from './style.scss'

const cx = cn.bind(css)

const Market = ({ title, description, outcomes, conditionId, outcomesSelected, setOutcomeForMarket, balances }) => {
  return (
    <div className={cx('market')}>
      <h1 className={cx('title')}>{title}</h1>
      <p>{description}</p>
      <div className={cx('outcomes')}>
        {outcomes.map((outcome, index) => (
          <Outcome
            key={index}
            {...outcome}
            balances={balances}
            isSelected={outcomesSelected[conditionId] === index}
            onSelectOutcome={() => setOutcomeForMarket(conditionId, index)}
          />
        ))}
      </div>
      <div className={cx('outcome-stats')}>
          {outcomes.map((outcome, index) => (
            (balances[outcome.positionId] && <OutcomeStats
              key={index}
              balance={balances[outcome.positionId]}
              isSelected={outcomesSelected[conditionId] === index}
              {...outcome}
            />)
          ))}
      </div>
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