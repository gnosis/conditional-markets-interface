import React from 'react'
import PropTypes from 'prop-types'
import Outcome from '../Outcome'
import OutcomeStats from '../OutcomeStats'
import cn from 'classnames/bind'

import css from './style.scss'

const cx = cn.bind(css)

const Market = ({ title, description, outcomes, conditionId, selectedOutcomes, selectOutcomes, disabled, assumption }) => {
  return (
    <div className={cx('market', { disabled })}>
      <h1 className={cx('title')}>{title}</h1>
      <p>{description}</p>
      <div className={cx('outcomes')}>
        {outcomes.map((outcome, index) => (
          <Outcome
            key={index}
            {...outcome}
            isDisabled={disabled}
            isCorrect={assumption == index}
            isSelected={selectedOutcomes[conditionId] === index}
            onSelectOutcome={() => selectOutcomes(conditionId, index)}
          />
        ))}
      </div>
      <div className={cx('outcome-stats')}>
          {outcomes.map((outcome, index) => (
            (outcome.balance && <OutcomeStats
              key={index}
              isCorrect={assumption == index}
              isSelected={selectedOutcomes[conditionId] === index}
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
    price: PropTypes.string,
  }))
}

Market.defaultProps = {
  selectedOutcomes: {}
}

export default Market