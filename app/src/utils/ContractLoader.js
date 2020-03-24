import TruffleContract from "@truffle/contract";
import assert from "assert";
import getCollateralInfo from "./collateral-info";

import ERC20DetailedArtifact from "../../../build/contracts/ERC20Detailed.json";
import IDSTokenArtifact from "../../../build/contracts/IDSToken.json";
import WETH9Artifact from "../../../build/contracts/WETH9.json";
import ConditionalTokensArtifact from "../../../build/contracts/ConditionalTokens.json";
import LMSRMarketMakerArtifact from "../../../build/contracts/LMSRMarketMaker.json";

const ERC20Detailed = TruffleContract(ERC20DetailedArtifact);
const IDSToken = TruffleContract(IDSTokenArtifact);
const WETH9 = TruffleContract(WETH9Artifact);
const ConditionalTokens = TruffleContract(ConditionalTokensArtifact);
const LMSRMarketMaker = TruffleContract(LMSRMarketMakerArtifact);

export default class ContractLoader {
  constructor({ lmsrAddress, web3 }) {
    assert(lmsrAddress, '"lmsrAddress is required"');
    assert(web3, '"web3 is required"');

    this._lmsrAddress = lmsrAddress;
    this._web3 = web3;
  }

  async loadContracts() {
    for (const Contract of [
      ERC20Detailed,
      IDSToken,
      WETH9,
      ConditionalTokens,
      LMSRMarketMaker
    ]) {
      Contract.setProvider(this._web3.currentProvider);
    }

    return LMSRMarketMaker.at(this._lmsrAddress)
      .then(lmsrMarketMaker => {
        return Promise.all([
          lmsrMarketMaker,
          lmsrMarketMaker.pmSystem(),
          lmsrMarketMaker.collateralToken()
        ]);
      })
      .then(([lmsrMarketMaker, pmSystemAddress, collateralTokenAddress]) => {
        return Promise.all([
          lmsrMarketMaker,
          ConditionalTokens.at(pmSystemAddress),
          this.loadCollateralInfo(
            { ERC20Detailed, IDSToken, WETH9 },
            collateralTokenAddress
          )
        ]);
      })
      .then(([lmsrMarketMaker, pmSystem, collateralToken]) => {
        return {
          lmsrMarketMaker,
          pmSystem,
          collateralToken
        };
      });
  }

  async loadCollateralInfo(contractsObject, collateralTokenAddress) {
    return getCollateralInfo(contractsObject, collateralTokenAddress);
  }
}
