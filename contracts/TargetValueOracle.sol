pragma solidity ^0.5.1;
import { PredictionMarketSystem } from "@gnosis.pm/hg-contracts/contracts/PredictionMarketSystem.sol";

contract TargetValueOracle {
    /// Prediction market system this oracle reports to.
    PredictionMarketSystem public pmSystem;
    /// Beginning of time window in which valid reports may be generated. Value is inclusive, meaning that the first valid timestamp is this.
    uint public resolutionTime;
    /// Target value at which oracle would report a full value in the first slot if the actual value was less than or equal to this target, and a full value in the second slot if the actual value exceeded the target.
    uint public targetValue;
    /// Question ID oracle will use during report to the prediction market system.
    bytes32 public questionId;

    /// @dev Emitted upon the successful reporting of whether the actual value has exceeded target to the prediction market system.
    /// @param resolutionTime Beginning of time window in which valid reports may be generated. 
    /// @param currentTime Time at which this oracle made a determination of the value.
    /// @param value The value found by this contract during the reporting of the value.
    event ResolutionSuccessful(uint resolutionTime, uint currentTime, uint value);
    
    constructor (
        PredictionMarketSystem _pmSystem,
        uint _resolutionTime,
        uint _targetValue,
        bytes32 _questionId
    ) public {
        pmSystem = _pmSystem;
        resolutionTime = _resolutionTime;
        targetValue = _targetValue;
        questionId = _questionId;
    }

    function readValue() internal returns(uint);

    /// @dev Triggers an oracle report. If the transaction occurs within the prescribed valid time window, the oracle will attempt to read a value and report a result to the prediction market system. The result reported will be two EVM words (2*32=64 bytes). If the witnessed value exceeds the target value, the first word will be 1 and the second will be 0. Otherwise, if the witnessed value is less than or equal to the target value, the first word will be 0 and the second will be 1. 
    /// @return value witnessed by this oracle
    function resolveValue() external {
        require(
            block.timestamp >= resolutionTime,
            "Please submit a resolution during the correct time interval"
        );

        uint value = readValue();
        if (value > targetValue) {
            pmSystem.receiveResult(questionId, abi.encode(1, 0));
        } else {
            pmSystem.receiveResult(questionId, abi.encode(0, 1));
        }
        emit ResolutionSuccessful(resolutionTime, block.timestamp, value);
    }
}
