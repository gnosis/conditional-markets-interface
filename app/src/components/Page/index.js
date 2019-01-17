import React from 'react'
import css from './style.scss'
import { compose, lifecycle, withState } from 'recompose'

import transformMarketEntries from '../../api/utils/transform'

import Market from '../Market'
import MarketEntries from '../../../markets.json'

import cn from 'classnames/bind'

const cx = cn.bind(css)

const entriesForNetwork = MarketEntries.RINKEBY

function Page({ markets, loadingState }) {
  if (loadingState === 'LOADING') {
    return <p>Loading...</p>
  }

  if (loadingState === 'ERROR') {
    return <p>We couldn't load the PM experiments at this time.</p>
  }

  return (
    <div className={cx('Page')}>
      <h1 className={cx('Heading')}>PM 2.0 Experiments</h1>
      {markets.map((market, index) => (
        <Market
          key={index}
          {...market} />
      ))}
    </div>
  )
}

const enhancer = compose(
  withState('loadingState', 'setLoading', 'UNKNOWN'),
  withState('markets', 'setMarkets', []),
  lifecycle({
    async componentDidMount() {
      this.props.setLoading('LOADING')
      try {
        const markets = await transformMarketEntries(entriesForNetwork)
        this.props.setLoading('SUCCESS')
        this.props.setMarkets(markets)
      } catch (err) {
        this.props.setLoading('ERROR')
      }
    }
  })
)


export default enhancer(Page)