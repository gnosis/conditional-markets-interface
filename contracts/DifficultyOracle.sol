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
    /// Question ID oracle will use during report to the prediction market system. 
    bytes32 public questionId;

    /// @dev Emitted upon the successful reporting of whether the difficulty has exceeded the difficulty target to the prediction market system.
    /// @param startTime Beginning of time window in which valid reports may be generated. 
    /// @param endTime End of time window in which valid reports may be generated.
    /// @param currentTime Time at which this oracle made a determination of the difficulty level.
    /// @param diff The difficulty level found by this contract during the reporting of the difficulty level.
    event DifficultyResolutionSuccessful(uint _startTime, uint _endTime, uint currentTime, uint diff);

    constructor (PredictionMarketSystem _pmSystem, uint _startTime, uint _endTime, uint _difficultyTarget, bytes32 _questionId) public {
        pmSystem = _pmSystem;
        startTime = _startTime;
        endTime = _endTime;
        difficultyTarget = _difficultyTarget; 
        questionId = _questionId;
    }

    /// @dev Triggers an oracle report. If the transaction occurs within the prescribed valid time window, the oracle will attempt to report a result to the prediction market system. The result reported will be two EVM words (2*32=64 bytes). If the witnessed difficulty exceeds the target difficulty, the first word will be 0 and the second will be 1. Otherwise, if the witnessed difficulty is less than or equal to the target difficulty, the first word will be 1 and the second will be 0.
    /// @return diff Difficulty level witnessed by this oracle (AUDIT: no return is necessary)
    function resolveDifficulty() external returns (uint) {
        if (block.timestamp >= startTime && block.timestamp <= endTime) {
            if (block.difficulty > difficultyTarget) {
                pmSystem.receiveResult(questionId, abi.encodePacked(bytes32(0), bytes32(uint(1))));
                emit DifficultyResolutionSuccessful(startTime, endTime, block.timestamp, block.difficulty);
                return block.difficulty;
            }
            pmSystem.receiveResult(questionId, abi.encodePacked(bytes32(uint(1)), bytes32(0)));
            emit DifficultyResolutionSuccessful(startTime, endTime, block.timestamp, block.difficulty);
            return block.difficulty;
        }
        revert("Please submit a resolution during the correct time interval");
    }
}