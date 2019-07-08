const resolutionDate = new Date();
resolutionDate.setDate(resolutionDate.getDate() + 30);

module.exports = [
  {
    questionId: `0x${"0".repeat(63)}a`,
    title: `A or B?`,
    resolutionDate: resolutionDate.toISOString(),
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
    questionId: `0x${"0".repeat(63)}b`,
    title: `X or Y?`,
    resolutionDate: resolutionDate.toISOString(),
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
  },
  {
    questionId: `0x${"0".repeat(63)}c`,
    title: `What will be the result of this longer question? It can be Foo or Bar, but it must be one of those.`,
    resolutionDate: resolutionDate.toISOString(),
    outcomes: [
      {
        title: "Foo",
        short: "Foo",
        when: "Foo"
      },
      {
        title: "Bar",
        short: "Bar",
        when: "Bar"
      }
    ]
  }
];
