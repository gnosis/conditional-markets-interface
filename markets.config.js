const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

module.exports = [
  {
    questionId: `0x${"0".repeat(63)}1`,
    title: `A or B?`,
    resolutionDate: tomorrow.toISOString(),
    outcomes: [
      {
        title: "A",
        short: "A",
        when: "A"
      },
      {
        title: "B",
        short: "B",
        when: "B"
      }
    ]
  },
  {
    questionId: `0x${"0".repeat(63)}2`,
    title: `X or Y?`,
    resolutionDate: tomorrow.toISOString(),
    outcomes: [
      {
        title: "X",
        short: "X",
        when: "X"
      },
      {
        title: "Y",
        short: "Y",
        when: "Y"
      }
    ]
  }
];
