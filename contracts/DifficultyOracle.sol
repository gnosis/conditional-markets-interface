pragma solidity ^0.5.1;
import '@gnosis.pm/hg-contracts/contracts/PredictionMarketSystem.sol';

contract DifficultyOracle {
    PredictionMarketSystem public pms;
    uint public blockNum;
    bytes32 questionId;
    
    constructor (PredictionMarketSystem _pms, uint _blockNum, bytes32 _questionId) public {
        pms = _pms;
        blockNum = _blockNum;
        questionId = _questionId;
    }

    function resolveHasHRate() public returns (uint diff) {
        uint currentBlock;
        
        assembly {
            diff := difficulty 
            currentBlock := currentBlock
        }

        if (blockNum == currentBlock) {
            pms.receiveResult(questionId, uintToBytes(diff));
            return diff;
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