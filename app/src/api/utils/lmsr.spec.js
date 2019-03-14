/*
const Decimal = require("decimal.js")

const { loadContract } = require("../../test/utils/web3")
const { loadPositions } = require("../balances")

jest.setTimeout(10000)

let funding
let balances = []
beforeAll(async (done) => {
  // load contract to compare values

  const LMSRFactory = await loadContract("LMSRMarketMakerFactory")
  console.log("got factory")
  const event = await LMSRFactory.getPastEvents("LMSRMarketMakerCreation", { fromBlock: 0, toBlock: 'latest' })
  console.log("got event")
  if (!event) {
    throw new Error("Could not retrieve previous LMSRMarketMakerCreation Event from Factory.")
  }

  const [{ args: { lmsrMarketMaker }}] = event
  const LMSRInstance = await loadContract("LMSRMarketMaker", lmsrMarketMaker)
  console.log("got instance")

  // get funding
  funding = (await LMSRInstance.funding()).toString()

  const PMSystem = await loadContract("PredictionMarketSystem");
  const positions = await loadPositions();

  balances = Promise.all(
    positions.map(async position => {
      const balance = (await PMSystem.balanceOf(lmsr, position)).abs().toString();

      return balance;
    })
  );



  done()
})

describe("lmsr.js", () => {
  // precheck
  it("should retrieve funding, balance, etc", () => {
    expect(new Decimal(funding).gte(new Decimal(0))).toBeTruthy()
    expect(balances.length).toBeGreaterThan(0)
  })

  describe("lmsrNetCost", () => {
    it("", () => {
      expect(new Decimal(funding).gte(new Decimal(0))).toBeTruthy()
  
    })
  })
})
*/