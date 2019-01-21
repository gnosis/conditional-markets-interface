import React from 'react'
import css from './style.scss'
import web3 from 'web3'
import { compose, lifecycle, withState, withStateHandlers, withProps, withHandlers } from 'recompose'

import { loadContract, loadConfig, getDefaultAccount } from '../../api/web3'
import transformMarketEntries from '../../api/utils/transform'
import { retrieveBalances } from '../../api/balances'

import Market from '../Market'
//import MarketEntries from '../../../markets.json'

import cn from 'classnames/bind'
const cx = cn.bind(css)
const { toBN } = web3.utils

const entriesForNetwork = [] //MarketEntries.RINKEBY

function Page({
  markets,
  invest,
  loadingState,
  outcomesSelected,
  setOutcomeForMarket,
  buyOutcomes,
  sellOutcomes,
  balances,
  handleInvestUpdate, 
}) {
  if (loadingState === 'LOADING') {
    return <p>Loading...</p>
  }

  if (loadingState === 'ERROR') {
    return <p>We couldn't load the PM experiments at this time.</p>
  }

  return (
    <div className={cx('page')}>
      <h1 className={cx('heading')}>PM 2.0 Experiments</h1>
      <p>Please enter the amount of tokens you wish to buy below</p>
      <input
        type="text"
        className={cx('invest')}
        placeholder="How many tokens do you wish to buy from the Market Maker?"
        value={invest || ""}
        onChange={handleInvestUpdate}
      ></input>
      {markets.map((market, index) => (
        <Market
          key={index}
          outcomesSelected={outcomesSelected}
          setOutcomeForMarket={setOutcomeForMarket}
          balances={balances}

          {...market} />
      ))}
      <button className={cx('buyOutcomes')} onClick={() => buyOutcomes(invest)} type="button">Buy Selected Outcomes</button>
      <button className={cx('sellOutcomes')} onClick={() => sellOutcomes(1e9)} type="button">Sell Selected Outcomes</button>
    </div>
  )
}

const enhancer = compose(
  withState('loadingState', 'setLoading', 'UNKNOWN'),
  withState('markets', 'setMarkets', []),
  withState('balances', 'setBalances', {}),
  withState('invest', 'setInvest'),
  withState('lmsr', 'setLMSR'),
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
    sellOutcomes: ({ outcomesSelected, markets, setMarkets, balances, setBalances }) => async (amount) => {
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

      const sellList = Array(markets.length * 2).fill().map((_, outcomeIndex) => {
        // CURRENTLY HARDCODED FOR 2 OUTCOMES
        // FIX THIS BEFORE USING MORE THAN 2
        const marketIndex = Math.floor(outcomeIndex / 2)
        const isSelected = marketOutcomeSelections[marketIndex] == (outcomeIndex - marketIndex * 2)
        if (isSelected) {
          return web3.utils.toBN(-Math.abs(amountPerOutcome))
        }
        return web3.utils.toBN(0)
      })

      const defaultAccount = await getDefaultAccount()

      // get market maker instance
      const LMSR = await loadContract('LMSRMarketMaker', '0x8c6aad0c92a48112aaa0e6e8f98a160120f17059')
      const cost = (await LMSR.calcNetCost.call(sellList)).neg()
      const fee = await LMSR.calcMarketFee.call(cost)
      const profit = cost.sub(fee)

      //console.log({ cost: cost.toString(), fee: fee.toString(), profit: profit.toString() })

      // get collateral
      const WETH = await loadContract('WETH9')
      const pmSystem = await loadContract('PredictionMarketSystem')
      await pmSystem.setApprovalForAll(LMSR.address, true, { from: defaultAccount })

      // run trade
      const tx = await LMSR.trade(sellList, toBN(1e10), { from: defaultAccount, gas: 1e6 })
      const { logs: [ { args: { outcomeTokenNetCost } } ] } = tx

      // update probabilities
      const PMSystem = await loadContract('PredictionMarketSystem')
      const newMarkets = await transformMarketEntries(entriesForNetwork, PMSystem, LMSR, WETH)
      setMarkets(newMarkets)
      
      const newBalances = await retrieveBalances(PMSystem, Object.keys(balances))
      setBalances(newBalances)
    },
    buyOutcomes: ({ outcomesSelected, markets, setMarkets, balances, setBalances, lmsr }) => async (amount) => {
      const hasSelectedEnoughOutcomes = Object.keys(outcomesSelected).length === markets.length

      if (!hasSelectedEnoughOutcomes) {
        alert("Please select an outcome for every market")
        return
      }

      if (amount == 0) {
        alert("Please enter your desired investment amount")
        return
      }
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
      //console.log(buyList)

      const defaultAccount = await getDefaultAccount()

      // get market maker instance
      const LMSR = await loadContract('LMSRMarketMaker', lmsr)
      const cost = await LMSR.calcNetCost.call(buyList)
      //console.log({ cost })

      // get collateral
      const WETH = await loadContract('WETH9')
      await WETH.deposit({ value: cost, from: defaultAccount })
      await WETH.approve(LMSR.address, cost, { from: defaultAccount })


      // run trade
      const tx = await LMSR.trade(buyList, cost, { from: defaultAccount })
      const { logs: [ { args: { outcomeTokenNetCost } } ] } = tx

      // update probabilities
      const PMSystem = await loadContract('PredictionMarketSystem')

      const config = await loadConfig()
      const newMarkets = await transformMarketEntries(config.markets, PMSystem, LMSR, WETH)
      setMarkets(newMarkets)
      //console.log({ outcomeTokenNetCost })
      
      const newBalances = await retrieveBalances(PMSystem, markets, Object.keys(balances))
      setBalances(newBalances)
    },
    handleInvestUpdate: ({ setInvest, invest, outcomesSelected, markets }) => async (e) => {
      setInvest(e.target.value)
      // todo: calculate tokens from desired invest
      /*
      let tokenAmounts = []

      // fill token amounts
      const PMSystem = await loadContract('PredictionMarketSystem')
      const LMSR = await loadContract('LMSRMarketMaker', '0x8c6aad0c92a48112aaa0e6e8f98a160120f17059')
      let lmsrOutcomeIndex = 0
      const marketOutcomeCountPromise = Promise.all(markets.map(async (market) => {
        const outcomeCount = (await PMSystem.getOutcomeSlotCount(market.conditionId)).toNumber()
        Array(outcomeCount).fill().forEach(() => {
          tokenAmounts[lmsrOutcomeIndex++] = 0
        })
      }))
      await marketOutcomeCountPromise
      
      let investLeft = toBN(invest)
      const lowestAmount = 1e-5

      if (!Object.keys(outcomesSelected).length) {
        return
      }

      let i = 0
      while(true) {
        tokenAmounts.forEach((_, tokenAmountIndex) => {
          tokenAmounts[tokenAmountIndex] += 1
        })

        const cost = await LMSR.calcNetCost.call(tokenAmounts)
        console.log(cost.toNumber())
        if (cost.gt(investLeft)) {
          break
        }

        if (i++ > 1000) break
      }
      console.log(tokenAmounts)
      */
    },
  }),
  lifecycle({
    async componentDidMount() {
      this.props.setLoading('LOADING')
      try {
        const config = await loadConfig()
        this.props.setLMSR(config.lmsr)

        const PMSystem = await loadContract('PredictionMarketSystem')
        const LMSR = await loadContract('LMSRMarketMaker', this.props.lmsr)
        const WETH = await loadContract('WETH9')
        const markets = await transformMarketEntries(config.markets, PMSystem, LMSR, WETH)
        this.props.setLoading('SUCCESS')
        this.props.setMarkets(markets)

        const balances = await retrieveBalances(PMSystem, markets)
        this.props.setBalances(balances)
      } catch (err) {
        console.error(err.stack)
        this.props.setLoading('ERROR')
      }
    }
  })
)


export default enhancer(Page)