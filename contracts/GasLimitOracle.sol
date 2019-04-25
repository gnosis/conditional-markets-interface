pragma solidity ^0.5.1;
import "@gnosis.pm/hg-contracts/contracts/PredictionMarketSystem.sol";

contract GasLimitOracle {
    /// Beginning of time window in which valid reports may be generated. Value is inclusive, meaning that the first valid timestamp is this.
    uint public startTime;
    /// End of time window in which valid reports may be generated. Value is inclusive, meaning that the last valid timestamp is this.
    uint public endTime;
    /// Block gas limit at which oracle would report a full value in the first slot if the actual gas limit was less than or equal to this target, and a full value in the second slot if the actual gas limit exceeded the target.
    uint public gasLimitTarget;
    /// Question ID oracle will use during report to the prediction market system.
    bytes32 public questionId;
    /// Prediction market system this oracle reports to.
    PredictionMarketSystem public pmSystem;

    /// @dev Emitted upon the successful reporting of whether the gas limit has exceeded the gas limit target to the prediction market system.
    /// @param _startTime Beginning of time window in which valid reports may be generated. 
    /// @param _endTime End of time window in which valid reports may be generated. 
    /// @param currentTime Time at which this oracle made a determination of the gas limit level.
    /// @param gasLimit The gas limit level found by this contract during the reporting of the gas limit level.
    event ResolutionSuccessful(uint _startTime, uint _endTime, uint currentTime, uint gasLimit);
    
    constructor (PredictionMarketSystem _pmSystem, uint _startTime, uint _endTime, uint _gasLimitTarget, bytes32 _questionId) public {
        pmSystem = _pmSystem;
        startTime = _startTime;
        endTime = _endTime;
        gasLimitTarget = _gasLimitTarget;
        questionId = _questionId;
    }

    /// @dev Triggers an oracle report. If the transaction occurs within the prescribed valid time window, the oracle will attempt to report a result to the prediction market system. The result reported will be two EVM words (2*32=64 bytes). If the witnessed gas limit exceeds the target gas limit, the first word will be 0 and the second will be 1. Otherwise, if the witnessed gas limit is less than or equal to the target gas limit, the first word will be 1 and the second will be 0.
    /// @return Gas limit witnessed by this oracle (AUDIT: no return is necessary)
    function resolveGasLimit() external returns(uint) {
      if (block.timestamp >= startTime && block.timestamp <= endTime) {
          if (block.gaslimit > gasLimitTarget) {  
            pmSystem.receiveResult(questionId, abi.encodePacked(bytes32(0), bytes32(uint(1))));
            emit ResolutionSuccessful(startTime, endTime, block.timestamp, block.gaslimit);
            return block.gaslimit;
          } 
          pmSystem.receiveResult(questionId, abi.encodePacked(bytes32(uint(1)), bytes32(0)));
          emit ResolutionSuccessful(startTime, endTime, block.timestamp, block.gaslimit);
          return block.gaslimit;
      }
      revert("Please submit a resolution during the correct time interval");
    }
}