const transformMarketEntries = async (markets) => {
  const outcomeProbability = Math.random()

  return markets.map((market) => ({
    ...market,
    outcomes: market.outcomes.map((outcome, index) => ({
      name: outcome,
      probability: Math.abs(index - outcomeProbability),
      price: 0.001 + (Math.random()*10)
    }))
  }))
}

export default transformMarketEntries