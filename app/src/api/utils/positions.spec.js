const { generatePositionId } = require("./positions");
const web3 = require("web3");

const { leftPad, toHex } = web3.utils;

const asAddress = num => `0x${leftPad(num.toString(16), 40)}`;

const MARKETS = [
  { title: "test", conditionId: asAddress(0x1), outcomes: ["A", "B"] },
  { title: "test 2", conditionId: asAddress(0x2), outcomes: ["A", "B"] }
];

const COLLATERAL = {
  address: asAddress(0x1337)
};

const positionIdForInput1 =
("86676152165960927632922549634644956680938048514950394062927506560185469839972");
const positionIdForInput2 =
("68302645151314052430602967469211240955076280393605528346073582106856316183665");

describe("positions.js", () => {
  describe("generatePositionId", () => {
    it("should correctly resolve for position id 1", () => {
      const positionId = generatePositionId(MARKETS, COLLATERAL, 1);

      expect(positionId).toBe(positionIdForInput1);
    });

    it("should correctly resolve for position id 2", () => {
      const positionId = generatePositionId(MARKETS, COLLATERAL, 2);

      expect(positionId).toBe(positionIdForInput2);
    });
  });
});
