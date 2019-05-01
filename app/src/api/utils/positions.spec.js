const {
  generatePositionId,
  generateCollectionIdList,
  generatePositionIdList
} = require("./positions");
const web3 = require("web3");

const { asBytes32, asAddress, normHex } = require("./solidity");

const { toHex } = web3.utils;

const MARKETS_2x2 = [
  { title: "test", conditionId: asBytes32(1), outcomes: ["A", "B"] },
  { title: "test 2", conditionId: asBytes32(2), outcomes: ["1", "2"] }
];

const MARKETS_3x2 = [
  { title: "test", conditionId: asBytes32(1), outcomes: ["A", "B"] },
  { title: "test 2", conditionId: asBytes32(2), outcomes: ["1", "2"] },
  { title: "test 3", conditionId: asBytes32(3), outcomes: ["X", "Y"] }
];

const COLLATERAL = {
  address: asAddress(1337)
};

describe("positions.js", () => {
  describe('"generatePositionId"', () => {
    it("should correctly resolve for position id 1", () => {
      const positionId = generatePositionId(MARKETS_2x2, COLLATERAL, 1);

      // result from remix testing
      expect(positionId).toBe(
        toHex(
          "56828239626858907487860350135876997470709407524746984530933585465025817494330"
        )
      );
    });

    it("should correctly resolve for position id 2", () => {
      const positionId = generatePositionId(MARKETS_2x2, COLLATERAL, 2);

      // result from remix testing
      expect(positionId).toBe(
        toHex(
          "72187503076580482455625643550285749060418326141458064663530457461725329351050"
        )
      );
    });
  });

  // example hashes from remix, using 3 markets with 2 outcomes each
  // market conditionIds: [0x00...1, 0x00...2, 0x00...3]
  // market collateral: 0x00...1337
  const TARGET_COLLECTION_IDS = [
    "0x7dfe757ecd65cbd7922a9c0161e935dd7fdbcc0e999689c7d31633896b1fc60b",
    "0x57cfe2b3cd17277b3602eef235ed18ab9d44ebc3e77904904fe92d1d5f0bf91a",
    "0x24396b13a782f39580d0f47d804fd809b4e39353bd03215dc1ab59e715947249",
    "0x40db5e8283ff06cf4efe67cb24418743657ef47fb4391e9694bec6ea31b3bbfa",
    "0xe5960b1ee6bfe74e601653c67f5e16362ec4f5285259c262cb8525cea1086897",
    "0xb1ff937ec12bb368aae45951c9c0d59446639cb827e3df303d4752985790e1c6",
    "0xcea186ed9da7c6a27911cc9f6db284cdf6fefde41f19dc69105abf9b73b02b77",
    "0x88601476d11616a71c5be67555bd1dff4b1cbf21533d2669b768b61518cfe1c3",
    "0x623181abd0c7724ac034396629c100cd6885ded6a11fa132343bafa90cbc14d2",
    "0x2e9b0a0bab333e650b023ef17423c02b8024866676a9bdffa5fddc72c3448e01",
    "0x4b3cfd7a87af519ed92fb23f18156f6530bfe7926ddfbb3879114975df63d7b2",
    "0xeff7aa16ea70321dea479e3a7331fe57fa05e83b0c005f04afd7a85a4eb8844f",
    "0xbc613276c4dbfe383515a3c5bd94bdb611a48fcae18a7bd22199d5240540fd7e",
    "0xd90325e5a15811720343171361866cefc23ff0f6d8c0790af4ad42272160472f"
  ];
  describe('"generateCollectionIdList"', () => {
    it("should generate the correct list for the example markets", () => {
      const positionIdList = generateCollectionIdList(MARKETS_3x2, 0);

      expect(positionIdList.map(normHex)).toEqual(
        TARGET_COLLECTION_IDS.map(normHex)
      );
    });
  });

  // example hashes from remix, using 3 markets with 2 outcomes each
  // market conditionIds: [0x00...1, 0x00...2, 0x00...3]
  // market collateral: 0x00...1337
  const TARGET_POSITION_IDS = [
    "8d306273ca8a4fd1795cba90e699e40fd64e7da36f15f6602d37e2d1f3d76cd3",
    "ee512087ff53a099af79d9b9a62a176556306b0db92f440c09f4eb35dd6c8538",
    "2ee5906fcf37175d33234a437e9e04566af6e41297e37d3c56969fe64f608aaf",
    "b7751557931f7d66ebf210a879214c4b177103bc31e8728053ddf2ee45fea54b",
    "7421ee1316c7fadd81a9ef449ac438acd1b4c37095468610e091b92e2f469e6c",
    "60a96a47fbb9d4002d6b12afe9e155bd260086948396c2c6ffef7a7d0750c8fe",
    "4be38b40d4a68bcab4e657a89480a0e2320e071ca271a1f324bf64d91eccb094",
    "6ae19327d0191dfbfafaa2d48ba5982b05a4997c7891afe3275b3ffd657b0349",
    "90f23da46c0099ee12f3be64d55abbc96ebc0492ccbc1f8febe6972656fd91b1",
    "c712c0f83e90d7e46639d7271edc60307822b5de540693cfa601636ee619223a",
    "7e1d4d90cc65b4c9301bb792eaa05fb97c7963517bc7985609a2bfed7ff2e61e",
    "2c1aeeb845c5e523ebbca9ee77e44c52ac7ec7ec7a47645071fc636f98507d74",
    "f49674616713695c74a9ec7e32007a27902e27fd25f546fde42ec5bd4b93ebb8",
    "c87449d1a98dfc9b4e8a84debd720d7846fbba5bb5e526034e6e3b4a6eb69cb3"
  ];
  describe('"generatePositionIdList"', () => {
    it("should generate the correct list for the example markets", () => {
      const positionIdList = generatePositionIdList(MARKETS_3x2, COLLATERAL, 0);

      expect(positionIdList.map(normHex)).toEqual(
        TARGET_POSITION_IDS.map(normHex)
      );
    });
  });
});
