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
  constructor({ web3, lmsrAddress, collateralTokenAddress }) {
    assert(web3, '"web3 is required"');
    assert(lmsrAddress, '"lmsrAddress is required"');
    assert(collateralTokenAddress, '"collateralTokenAddress is required"');

    this._web3 = web3;
    this._lmsrAddress = lmsrAddress;
    this._lmsrMarketMaker = undefined;
    this._collateralToken = undefined;
    this._collateralTokenAddress = collateralTokenAddress;
    this._pmSystem = undefined;
    this._pmSystemAddress = undefined;
  }

  setWeb3Instance(web3) {
    this._web3 = web3;
  }

  updateContractsWeb3Provider() {
    for (const Contract of [
      ERC20Detailed,
      IDSToken,
      WETH9,
      ConditionalTokens,
      LMSRMarketMaker
    ]) {
      Contract.setProvider(this._web3.currentProvider);
    }
  }

  async loadContracts() {
    this.updateContractsWeb3Provider();

    const collateralTokenPromise = this.loadCollateralInfo(
      { ERC20Detailed, IDSToken, WETH9 },
      this._collateralTokenAddress
    );

    return Promise.all([
      this._lmsrMarketMaker || LMSRMarketMaker.at(this._lmsrAddress)
    ])
      .then(([lmsrMarketMaker]) => {
        this._lmsrMarketMaker = lmsrMarketMaker;
        return Promise.all([
          this._pmSystemAddress || lmsrMarketMaker.pmSystem()
        ]);
      })
      .then(([pmSystemAddress]) => {
        this._pmSystemAddress = pmSystemAddress;
        return Promise.all([
          this._pmSystem || ConditionalTokens.at(pmSystemAddress),
          collateralTokenPromise
        ]);
      })
      .then(([pmSystem, collateralToken]) => {
        this._pmSystem = pmSystem;
        this._collateralToken = collateralToken;

        return {
          lmsrMarketMaker: this._lmsrMarketMaker,
          pmSystem,
          collateralToken
        };
      });
  }

  async loadCollateralInfo(contractsObject, collateralTokenAddress) {
    return Promise.all([
      this._collateralToken ||
        getCollateralInfo(contractsObject, collateralTokenAddress)
    ]).then(([collateral]) => collateral);
  }
}
