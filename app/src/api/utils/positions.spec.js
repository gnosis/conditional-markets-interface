const { generatePositionId } = require("./positions");
const web3 = require("web3");

const { leftPad, toHex } = web3.utils;

const asAddress = num => `0x${leftPad(num.toString(16), 40)}`;
const asBytes32 = num => `0x${leftPad(num.toString(16), 64)}`;

const MARKETS = [
  { title: "test", conditionId: asBytes32(0x1), outcomes: ["A", "B"] },
  { title: "test 2", conditionId: asBytes32(0x2), outcomes: ["A", "B"] }
];

const COLLATERAL = {
  address: asAddress(0x1337)
};

describe("positions.js", () => {
  describe("generatePositionId", () => {
    it("should correctly resolve for position id 1", () => {
      const positionId = generatePositionId(MARKETS, COLLATERAL, 1);

      // result from remix testing
      expect(positionId).toBe(toHex("56828239626858907487860350135876997470709407524746984530933585465025817494330"));
    });

    it("should correctly resolve for position id 2", () => {
      const positionId = generatePositionId(MARKETS, COLLATERAL, 2);

      // result from remix testing
      expect(positionId).toBe(toHex("72187503076580482455625643550285749060418326141458064663530457461725329351050"));
    });
  });
});
