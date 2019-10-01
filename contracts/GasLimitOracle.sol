pragma solidity ^0.5.1;
import { ConditionalTokens } from "@gnosis.pm/conditional-tokens-contracts/contracts/ConditionalTokens.sol";
import { TargetValueOracle } from "./TargetValueOracle.sol";

contract GasLimitOracle is TargetValueOracle {
    constructor (
        ConditionalTokens pmSystem,
        uint resolutionTime,
        uint difficultyTarget,
        bytes32 questionId
    ) public TargetValueOracle(pmSystem, resolutionTime, difficultyTarget, questionId) {}

    function readValue() internal returns(uint) {
        return block.gaslimit;
    }
}
