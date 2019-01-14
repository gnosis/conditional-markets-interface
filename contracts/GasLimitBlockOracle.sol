pragma solidity ^0.5.1;
import "@gnosis.pm/hg-contracts/contracts/PredictionMarketSystem.sol";

contract GasLimitBlockOracle {
    uint public startBlock;
    uint public endBlock;
    uint public gasLimitTarget;
    bytes32 questionId;
    PredictionMarketSystem public pmSystem;
    
    constructor (PredictionMarketSystem _pmSystem, uint _startBlock, uint _endBlock, uint _gasLimitTarget, bytes32 _questionId) public {
        pmSystem = _pmSystem;
        startBlock = _startBlock;
        endBlock = _endBlock;
        gasLimitTarget = _gasLimitTarget;
        questionId = _questionId;
    }
  
    function resolveGasLimit() public returns(uint) {
      uint gasLimit;
      uint currentBlock;

      assembly {
        gasLimit := gaslimit
        currentBlock := currentBlock
      }

      if (currentBlock >= startBlock && currentBlock <= endBlock) {
          if (gasLimit > gasLimitTarget) {  
            pmSystem.receiveResult(questionId, abi.encodePacked(bytes32(0), bytes32(uint(1))));
            return gasLimit;
          } 
          pmSystem.receiveResult(questionId, abi.encodePacked(bytes32(uint(1)), bytes32(0)));
          return gasLimit;
      }

      revert("Not the correct current block");
    }
}