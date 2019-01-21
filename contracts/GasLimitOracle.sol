pragma solidity ^0.5.1;
import "@gnosis.pm/hg-contracts/contracts/PredictionMarketSystem.sol";

contract GasLimitOracle {
    uint public startTime;
    uint public endTime;
    uint public gasLimitTarget;
    bytes32 questionId;
    PredictionMarketSystem public pmSystem;

    event resolutionSuccessful(uint startTime, uint endTime, uint currentTime, uint gasLimit);
    event resolutionFailed(uint startTime, uint endTime, uint currentTime, uint gasLimit);

    
    constructor (PredictionMarketSystem _pmSystem, uint _startTime, uint _endTime, uint _gasLimitTarget, bytes32 _questionId) public {
        pmSystem = _pmSystem;
        startTime = _startTime;
        endTime = _endTime;
        gasLimitTarget = _gasLimitTarget;
        questionId = _questionId;
    }
  
    function resolveGasLimit() public returns(uint) {
      uint gasLimit;
      uint currentTime = block.timestamp;

      assembly {
        gasLimit := gaslimit
      }

      if (currentTime >= startTime && currentTime <= endTime) {
          if (gasLimit > gasLimitTarget) {  
            pmSystem.receiveResult(questionId, abi.encodePacked(bytes32(0), bytes32(uint(1))));
            emit resolutionSuccessful(startTime, endTime, currentTime, gasLimit);
            return gasLimit;
          } 
          pmSystem.receiveResult(questionId, abi.encodePacked(bytes32(uint(1)), bytes32(0)));
          emit resolutionSuccessful(startTime, endTime, currentTime, gasLimit);
          return gasLimit;
      }
      emit resolutionFailed(startTime, endTime, currentTime, gasLimit);
      revert("Please submit a resolution during the correct time interval");
    }
}