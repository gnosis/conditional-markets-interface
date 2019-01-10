pragma solidity ^0.5.1;
import '@gnosis.pm/hg-contracts/contracts/PredictionMarketSystem.sol';

contract GasLimitOracle {
    uint public blockNum;
    bytes32 questionId;
    PredictionMarketSystem public pms;
    
    constructor (PredictionMarketSystem _pms, uint _blockNum, bytes32 _questionId) public {
        pms = _pms;
        blockNum = _blockNum;
        questionId = _questionId;
    }
  
    function resolveGasLimit() public returns(uint) {
      uint gasLimit;
      uint currentBlock;

      assembly {
          gasLimit := gaslimit
          currentBlock := currentBlock
      }

      if (blockNum == currentBlock) {  
        pms.receiveResult(questionId, uintToBytes(gasLimit));
        return gasLimit;
      }

      revert('Not the correct current block');
    }

    function uintToBytes(uint x) internal pure returns (bytes memory b) {
        require(x < 2**256-1, 'Integer overflow from bytes32 --> bytes conversion.');
        b = new bytes(32);
        for (uint i=0; i<32; i++) {
            b[i] = byte(uint8(x / (2**(8*(31 - i)))));
        }
    }
    
}