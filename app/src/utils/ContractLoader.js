// const environment = process.env.NODE_ENV;
// const isLocal = environment === 'local';
const assert = require("assert");

class ContractLoader {
  constructor({ lmsrAddress, web3 }) {
    assert(lmsrAddress, '"lmsrAddress is required"');
    assert(web3, '"web3 is required"');

    this._lmsrAddress = lmsrAddress;
    this._web3 = web3;
  }

  async loadContracts() {
    const [
      { default: TruffleContract },
      ERC20DetailedArtifact,
      IDSTokenArtifact,
      WETH9Artifact,
      ConditionalTokensArtifact,
      LMSRMarketMakerArtifact
    ] = await Promise.all([
      import("@truffle/contract"),
      import("../../../build/contracts/ERC20Detailed.json"),
      import("../../../build/contracts/IDSToken.json"),
      import("../../../build/contracts/WETH9.json"),
      import("../../../build/contracts/ConditionalTokens.json"),
      import("../../../build/contracts/LMSRMarketMaker.json")
    ]);

    const ERC20Detailed = TruffleContract(ERC20DetailedArtifact);
    const IDSToken = TruffleContract(IDSTokenArtifact);
    const WETH9 = TruffleContract(WETH9Artifact);
    const ConditionalTokens = TruffleContract(ConditionalTokensArtifact);
    const LMSRMarketMaker = TruffleContract(LMSRMarketMakerArtifact);

    for (const Contract of [
      ERC20Detailed,
      IDSToken,
      WETH9,
      ConditionalTokens,
      LMSRMarketMaker
    ]) {
      Contract.setProvider(this._web3.currentProvider);
    }

    const lmsrMarketMaker = await LMSRMarketMaker.at(this._lmsrAddress);

    const pmSystem = await ConditionalTokens.at(
      await lmsrMarketMaker.pmSystem()
    );

    return {
      ERC20Detailed,
      IDSToken,
      WETH9,
      pmSystem,
      lmsrMarketMaker
    };
  }
}

module.exports = ContractLoader;
