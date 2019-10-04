pragma solidity ^0.5.1;
import { ConditionalTokens } from "@gnosis.pm/conditional-tokens-contracts/contracts/ConditionalTokens.sol";
import { TargetValueOracle } from "./TargetValueOracle.sol";

interface IDaiTub {
    function fee() external view returns (uint);
}

contract DaiStabilityFeeOracle is TargetValueOracle {
    IDaiTub public daiTub;

    constructor (
        ConditionalTokens pmSystem,
        uint resolutionTime,
        uint targetETHPrice,
        bytes32 questionId,
        IDaiTub _daiTub
    ) public TargetValueOracle(pmSystem, resolutionTime, targetETHPrice, questionId) {
        daiTub = _daiTub;
    }

    function readValue() internal returns(uint) {
        return daiTub.fee();
    }
}
