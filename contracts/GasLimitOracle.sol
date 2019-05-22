pragma solidity ^0.5.1;
import { PredictionMarketSystem } from "@gnosis.pm/hg-contracts/contracts/PredictionMarketSystem.sol";
import { TargetValueOracle } from "./TargetValueOracle.sol";

contract GasLimitOracle is TargetValueOracle {
    constructor (
        PredictionMarketSystem pmSystem,
        uint startTime,
        uint endTime,
        uint difficultyTarget,
        bytes32 questionId
    ) public TargetValueOracle(pmSystem, startTime, endTime, difficultyTarget, questionId) {}

    function readValue() internal returns(uint) {
        return block.gaslimit;
    }
}
