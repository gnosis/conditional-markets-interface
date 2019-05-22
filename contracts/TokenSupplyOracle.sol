pragma solidity ^0.5.1;

import { PredictionMarketSystem } from "@gnosis.pm/hg-contracts/contracts/PredictionMarketSystem.sol";
import { TargetValueOracle } from "./TargetValueOracle.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract TokenSupplyOracle is TargetValueOracle {
    IERC20 token;

    constructor (
        PredictionMarketSystem pmSystem,
        uint startTime,
        uint endTime,
        uint difficultyTarget,
        bytes32 questionId,
        IERC20 _token
    ) public TargetValueOracle(pmSystem, startTime, endTime, difficultyTarget, questionId) {
        token = _token;
    }

    function readValue() internal returns(uint) {
        return token.totalSupply();
    }
}
