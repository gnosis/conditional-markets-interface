pragma solidity ^0.5.1;
import "@gnosis.pm/hg-contracts/contracts/PredictionMarketSystem.sol";

contract GasLimitOracle {
    /// Beginning of time window in which valid reports may be generated. Value is inclusive, meaning that the first valid timestamp is this.
    uint public startTime;
    /// End of time window in which valid reports may be generated. Value is inclusive, meaning that the last valid timestamp is this.
    uint public endTime;
    /// Block gas limit at which oracle would report a full value in the first slot if the actual gas limit was less than or equal to this target, and a full value in the second slot if the actual gas limit exceeded the target.
    uint public gasLimitTarget;
    /// Question ID oracle will use during report to the prediction market system. (AUDIT: this has no accessor unlike the other variables?)
    bytes32 questionId;
    /// Prediction market system this oracle reports to.
    PredictionMarketSystem public pmSystem;

    /// @dev Emitted upon the successful reporting of whether the gas limit has exceeded the gas limit target to the prediction market system.
    /// @param startTime Beginning of time window in which valid reports may be generated. (AUDIT: duplicate of storage var)
    /// @param endTime End of time window in which valid reports may be generated. (AUDIT: duplicate of storage var)
    /// @param currentTime Time at which this oracle made a determination of the gas limit level.
    /// @param gasLimit The gas limit level found by this contract during the reporting of the gas limit level.
    event resolutionSuccessful(uint startTime, uint endTime, uint currentTime, uint gasLimit);
    // (AUDIT: This event never gets emitted)
    event resolutionFailed(uint startTime, uint endTime, uint currentTime, uint gasLimit);

    
    constructor (PredictionMarketSystem _pmSystem, uint _startTime, uint _endTime, uint _gasLimitTarget, bytes32 _questionId) public {
        pmSystem = _pmSystem;
        startTime = _startTime;
        endTime = _endTime;
        gasLimitTarget = _gasLimitTarget;
        questionId = _questionId;
    }

    /// @dev Triggers an oracle report. If the transaction occurs within the prescribed valid time window, the oracle will attempt to report a result to the prediction market system. The result reported will be two EVM words (2*32=64 bytes). If the witnessed gas limit exceeds the target gas limit, the first word will be 0 and the second will be 1. Otherwise, if the witnessed gas limit is less than or equal to the target gas limit, the first word will be 1 and the second will be 0. (AUDIT: this function's visibility can be limited to external)
    /// @return Gas limit witnessed by this oracle (AUDIT: no return is necessary)
    function resolveGasLimit() public returns(uint) {
      // AUDIT: use block.* properties directly instead of pushing new variables on the stack for efficiency
      uint gasLimit;
      uint currentTime = block.timestamp;

      // AUDIT: why not use block.gaslimit?
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
      // AUDIT: If revert happens, no event would be emitted
      emit resolutionFailed(startTime, endTime, currentTime, gasLimit);
      revert("Please submit a resolution during the correct time interval");
    }
}