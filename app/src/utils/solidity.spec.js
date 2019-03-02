const { asAddress, asBytes32, normHex } = require("./solidity");

describe("solidity.js", () => {
  describe('"asAddress()"', () => {
    it("should parse addresses correctly", () => {
      const input = 1337;
      const expected = "0x0000000000000000000000000000000000001337";

      expect(asAddress(input)).toBe(expected);
    });

    it("should parse addresses as strings correctly", () => {
      const input = "0x1337";
      const expected = "0x0000000000000000000000000000000000001337";

      expect(asAddress(input)).toBe(expected);
    });

    it("it shouldn't alter correct addresses", () => {
      const inputAndExpected = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1";

      expect(asAddress(inputAndExpected)).toBe(inputAndExpected);
    });

    it("should error with unexpected data", () => {
      const input = "ZZZ";
      expect(() => asAddress(input)).toThrowError();
    });
  });

  describe('"asBytes32()"', () => {
    it("should pad data correctly", () => {
      const input = 1;
      const expectedLength = 64;

      expect(asBytes32(input).length).toBe(expectedLength);
      expect(asBytes32(input).slice(0, 2)).not.toContain("0x");
    });

    it("should convert to correct number base", () => {
      const input = 1337;
      const expected =
        "0000000000000000000000000000000000000000000000000000000000000539";

      expect(asBytes32(input)).toBe(expected);
    });

    it("should work with strings", () => {
      const input = "0x1337";
      const expected =
        "0000000000000000000000000000000000000000000000000000000000001337";

      expect(asBytes32(input)).toBe(expected);
    });

    it("should error with unexpected data", () => {
      const input = "ZZZ";
      expect(() => asBytes32(input)).toThrowError();
    });
  });
});
