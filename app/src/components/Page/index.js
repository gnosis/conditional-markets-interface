import React from 'react'
import css from './style.scss'
import web3 from 'web3'
import { compose, lifecycle, withState, withStateHandlers, withProps, withHandlers } from 'recompose'

import { loadContract, getDefaultAccount } from '../../api/web3'
import transformMarketEntries from '../../api/utils/transform'
import { retrieveBalances } from '../../api/balances'

import Market from '../Market'
import MarketEntries from '../../../markets.json'

import cn from 'classnames/bind'
const cx = cn.bind(css)

const entriesForNetwork = MarketEntries.RINKEBY

function Page({ markets, loadingState, outcomesSelected, setOutcomeForMarket, buyOutcomes, balances }) {
  if (loadingState === 'LOADING') {
    return <p>Loading...</p>
  }

  if (loadingState === 'ERROR') {
    return <p>We couldn't load the PM experiments at this time.</p>
  }

  return (
    <div className={cx('page')}>
      <h1 className={cx('heading')}>PM 2.0 Experiments</h1>
      {markets.map((market, index) => (
        <Market
          key={index}
          outcomesSelected={outcomesSelected}
          setOutcomeForMarket={setOutcomeForMarket}
          balances={balances}

          {...market} />
      ))}
      <button className={cx('buyOutcomes')} onClick={() => buyOutcomes(1e9)} type="button">Buy Selected Outcomes</button>
    </div>
  )
}

const enhancer = compose(
  withState('loadingState', 'setLoading', 'UNKNOWN'),
  withState('markets', 'setMarkets', []),
  withState('balances', 'setBalances', {}),
  withStateHandlers({
    outcomesSelected: {}
  }, {
    setOutcomeForMarket: ({ outcomesSelected}) => (conditionId, outcomeIndex) => ({
      outcomesSelected: {
        ...outcomesSelected,
        [conditionId]: outcomeIndex
      }
    }),
  }),
  withHandlers({
    buyOutcomes: ({ outcomesSelected, markets, setMarkets }) => async (amount) => {
      const marketOutcomeSelections = []
      Object.keys(outcomesSelected).forEach((conditionId) => {
        let foundMarketIndex = 0
        markets.forEach((market, marketIndex) => {
          if (market.conditionId === conditionId) {
            foundMarketIndex = marketIndex
          }
        })
        
        marketOutcomeSelections[foundMarketIndex] = outcomesSelected[conditionId]
      })

      const amountPerOutcome = amount / marketOutcomeSelections.length

      const buyList = Array(markets.length * 2).fill().map((_, outcomeIndex) => {
        // CURRENTLY HARDCODED FOR 2 OUTCOMES
        // FIX THIS BEFORE USING MORE THAN 2
        const marketIndex = Math.floor(outcomeIndex / 2)
        const isSelected = marketOutcomeSelections[marketIndex] == (outcomeIndex - marketIndex * 2)
        if (isSelected) {
          return amountPerOutcome
        }
        return web3.utils.toBN(0)
      })

      const defaultAccount = await getDefaultAccount()

      // get market maker instance
      const LMSR = await loadContract('LMSRMarketMaker', '0x034b0233a06f88e7fc7caec284b4cd69edb0f76c')
      const cost = await LMSR.calcNetCost.call(buyList)
      console.log({ cost })

      // get collateral
      const WETH = await loadContract('WETH9')
      await WETH.deposit({ value: cost, from: defaultAccount })
      await WETH.approve(LMSR.address, cost, { from: defaultAccount })


      // run trade
      const tx = await LMSR.trade(buyList, cost, { from: defaultAccount })
      const { logs: [ { args: { outcomeTokenNetCost } } ] } = tx

      // update probabilities
      const PMSystem = await loadContract('PredictionMarketSystem')
      const newMarkets = await transformMarketEntries(entriesForNetwork, PMSystem, LMSR, WETH)
      setMarkets(newMarkets)
      console.log({ outcomeTokenNetCost })
      
    }
  }),
  lifecycle({
    async componentDidMount() {
      this.props.setLoading('LOADING')
      try {
        const PMSystem = await loadContract('PredictionMarketSystem')
        const LMSR = await loadContract('LMSRMarketMaker', '0x034b0233a06f88e7fc7caec284b4cd69edb0f76c')
        const WETH = await loadContract('WETH9')
        const markets = await transformMarketEntries(entriesForNetwork, PMSystem, LMSR, WETH)
        this.props.setLoading('SUCCESS')
        this.props.setMarkets(markets)

        const balances = await retrieveBalances(PMSystem)
        this.props.setBalances(balances)
      } catch (err) {
        console.error(err.stack)
        this.props.setLoading('ERROR')
      }
    }
  })
)


export default enhancer(Page)