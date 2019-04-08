pragma solidity ^0.5.1;
import "@gnosis.pm/hg-contracts/contracts/PredictionMarketSystem.sol";

contract DifficultyOracle {
    /// Prediction market system this oracle reports to.
    PredictionMarketSystem public pmSystem;
    /// Beginning of time window in which valid reports may be generated. Value is inclusive, meaning that the first valid timestamp is this.
    uint public startTime;
    /// End of time window in which valid reports may be generated. Value is inclusive, meaning that the last valid timestamp is this.
    uint public endTime;
    /// Difficulty level at which oracle would report a full value in the first slot if the actual difficulty was less than or equal to this target, and a full value in the second slot if the actual difficulty exceeded the target.
    uint public difficultyTarget;
    /// Question ID oracle will use during report to the prediction market system. (AUDIT: this has no accessor unlike the other variables?)
    bytes32 questionId;

    /// @dev Emitted upon the successful reporting of whether the difficulty has exceeded the difficulty target to the prediction market system.
    /// @param startTime Beginning of time window in which valid reports may be generated. (AUDIT: duplicate of storage var)
    /// @param endTime End of time window in which valid reports may be generated. (AUDIT: duplicate of storage var)
    /// @param currentTime Time at which this oracle made a determination of the difficulty level.
    /// @param diff The difficulty level found by this contract during the reporting of the difficulty level.
    event DiffResolutionSuccessful(uint startTime, uint endTime, uint currentTime, uint diff);
    // (AUDIT: This event never gets emitted)
    event resolutionFailed(uint startTime, uint endTime, uint currentTime, uint diff);

    constructor (PredictionMarketSystem _pmSystem, uint _startTime, uint _endTime, uint _difficultyTarget, bytes32 _questionId) public {
        pmSystem = _pmSystem;
        startTime = _startTime;
        endTime = _endTime;
        difficultyTarget = _difficultyTarget; 
        questionId = _questionId;
    }

    /// @dev Triggers an oracle report. If the transaction occurs within the prescribed valid time window, the oracle will attempt to report a result to the prediction market system. The result reported will be two EVM words (2*32=64 bytes). If the witnessed difficulty exceeds the block difficulty, the first word will be 0 and the second will be 1. Otherwise, if the witnessed difficulty is less than or equal to the block difficulty, the first word will be 1 and the second will be 0. (AUDIT: this function's visibility can be limited to external)
    /// @return diff Difficulty level witnessed by this oracle (AUDIT: no return is necessary)
    function resolveDifficulty() public returns (uint diff) {
        // AUDIT: it would be more gas-efficient to use block.timestamp and block.difficulty directly
        // (no need to keep a copy of them on the stack: they have their own special cheap opcodes)
        uint currentTime = block.timestamp;
        diff = block.difficulty;

        if (currentTime >= startTime && currentTime <= endTime) {
            if (diff > difficultyTarget) {
                pmSystem.receiveResult(questionId, abi.encodePacked(bytes32(0), bytes32(uint(1))));
                emit DiffResolutionSuccessful(startTime, endTime, currentTime, diff);
                return diff;
            }
            pmSystem.receiveResult(questionId, abi.encodePacked(bytes32(uint(1)), bytes32(0)));
            emit DiffResolutionSuccessful(startTime, endTime, currentTime, diff);
            return diff;
        }
        // AUDIT: If revert happens, no event would be emitted. Also, this is the wrong event.
        emit DiffResolutionSuccessful(startTime, endTime, currentTime, diff);
        revert("Please submit a resolution during the correct time interval");
    }
}