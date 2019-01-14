pragma solidity ^0.5.1;
import "@gnosis.pm/hg-contracts/contracts/PredictionMarketSystem.sol";

contract DifficultyBlockOracle {
    PredictionMarketSystem public pmSystem;
    uint public startBlock;
    uint public endBlock;
    uint public difficultyTarget;
    bytes32 questionId;
    
    constructor (PredictionMarketSystem _pmSystem, uint _startBlock, uint _endBlock, uint _difficultyTarget, bytes32 _questionId) public {
        pmSystem = _pmSystem;
        startBlock = _startBlock;
        endBlock = _endBlock;
        difficultyTarget = _difficultyTarget; 
        questionId = _questionId;
    }

    function resolveDifficulty() public returns (uint diff) {
        uint currentBlock;
        
        assembly {
            diff := difficulty 
            currentBlock := currentBlock
        }

        if (currentBlock >= startBlock && currentBlock <= endBlock) {
            if (diff > difficultyTarget) {
                pmSystem.receiveResult(questionId, abi.encodePacked(bytes32(0), bytes32(uint(1))));
                return diff;
            }
            pmSystem.receiveResult(questionId, abi.encodePacked(bytes32(uint(1)), bytes32(0)));
            return diff;
        }
        
        revert("Not the correct current block");
    }
}