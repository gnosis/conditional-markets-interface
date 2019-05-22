pragma solidity ^0.5.1;
import { PredictionMarketSystem } from "@gnosis.pm/hg-contracts/contracts/PredictionMarketSystem.sol";
import { TargetValueOracle } from "./TargetValueOracle.sol";

interface IDaiTub {
    function fee() external view returns (uint);
}

contract DaiStabilityFeeOracle is TargetValueOracle {
    IDaiTub public daiTub;

    constructor (
        PredictionMarketSystem pmSystem,
        uint startTime,
        uint endTime,
        uint targetETHPrice,
        bytes32 questionId,
        IDaiTub _daiTub
    ) public TargetValueOracle(pmSystem, startTime, endTime, targetETHPrice, questionId) {
        daiTub = _daiTub;
    }

    function readValue() internal returns(uint) {
        return daiTub.fee();
    }
}
