pragma solidity ^0.5.1;
import "@gnosis.pm/hg-contracts/contracts/PredictionMarketSystem.sol";

contract DifficultyOracle {
    PredictionMarketSystem public pmSystem;
    uint public startTime;
    uint public endTime;
    uint public difficultyTarget;
    bytes32 questionId;
    
    event DiffResolutionSuccessful(uint startTime, uint endTime, uint currentTime, uint diff);
    event resolutionFailed(uint startTime, uint endTime, uint currentTime, uint diff);

    constructor (PredictionMarketSystem _pmSystem, uint _startTime, uint _endTime, uint _difficultyTarget, bytes32 _questionId) public {
        pmSystem = _pmSystem;
        startTime = _startTime;
        endTime = _endTime;
        difficultyTarget = _difficultyTarget; 
        questionId = _questionId;
    }

    function resolveDifficulty() public returns (uint diff) {
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
        emit DiffResolutionSuccessful(startTime, endTime, currentTime, diff);
        revert("Please submit a resolution during the correct time interval");
    }
}