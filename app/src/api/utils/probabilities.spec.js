const { resolvePartitionSets } = require("./probabilities");

describe.only("probabilities.js", () => {
  describe("resolvePartitionSets", () => {
    it("should have the correct length", () => {
      const input = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

      const { outcomePairs } = resolvePartitionSets(input);
      expect(outcomePairs.flat().length).toBe(27);
    });

    it("should use the correct outcome-row ids", () => {
      const input = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

      const { outcomePairs } = resolvePartitionSets(input)
      expect(outcomePairs.flat()[0]).toBe('A&1&X')
      expect(outcomePairs.flat()[10]).toBe('B&1&Y')
    })

    it('should work with 2x2', () => {
      const input = [[0, 0], [0, 0]];

      const { outcomePairs } = resolvePartitionSets(input)
      expect(outcomePairs.flat()).toEqual([
        'A&1',
        'A&2',
        'B&1',
        'B&2'
      ])
    })
  });
});
