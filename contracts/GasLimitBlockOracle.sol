pragma solidity ^0.5.1;
import "@gnosis.pm/hg-contracts/contracts/PredictionMarketSystem.sol";

contract GasLimitBlockOracle {
    uint public startBlock;
    uint public endBlock;
    bytes32 questionId;
    PredictionMarketSystem public pmSystem;
    
    constructor (PredictionMarketSystem _pmSystem, uint _startBlock, uint _endBlock, bytes32 _questionId) public {
        pmSystem = _pmSystem;
        startBlock = _startBlock;
        endBlock = _endBlock;
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
        pmSystem.receiveResult(questionId, uintToBytes(gasLimit));
        return gasLimit;
      }

      revert("Not the correct current block");
    }

    function uintToBytes(uint x) internal pure returns (bytes memory b) {
        require(x < 2**256-1, "Integer overflow from bytes32 --> bytes conversion.");
        b = new bytes(32);
        for (uint i=0; i<32; i++) {
            b[i] = byte(uint8(x / (2**(8*(31 - i)))));
        }
    }
    
}