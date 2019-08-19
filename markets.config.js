const resolutionDate = new Date();
resolutionDate.setDate(resolutionDate.getDate() + 14);

module.exports = [
  {
    questionId: `0x${"0".repeat(63)}a`,
    title: `Will the DAI price exceed $1 according to the DutchX last auction closing price and Maker ETH price feed?`,
    resolutionDate: resolutionDate.toISOString(),
    outcomes: [
      {
        title: "Yes",
        short: "Yes",
        when: "1 DAI > $1"
      },
      {
        title: "No",
        short: "No",
        when: "1 DAI ≤ $1"
      }
    ]
  },
  {
    questionId: `0x${"0".repeat(63)}b`,
    title: "Will the DAI supply exceed 81 million DAI?",
    resolutionDate: resolutionDate.toISOString(),
    outcomes: [
      {
        title: "Yes",
        short: "Yes",
        when: "DAI supply > 81 million DAI"
      },
      {
        title: "No",
        short: "No",
        when: "DAI supply ≤ 81 million DAI"
      }
    ]
  },
  {
    questionId: `0x${"0".repeat(63)}c`,
    title: "Will the DAI stability fee exceed 17.5%?",
    resolutionDate: resolutionDate.toISOString(),
    outcomes: [
      {
        title: "Yes",
        short: "Yes",
        when: "DAI stability fee > 17.5%"
      },
      {
        title: "No",
        short: "No",
        when: "DAI stability fee ≤ 17.5%"
      }
    ]
  }
];
