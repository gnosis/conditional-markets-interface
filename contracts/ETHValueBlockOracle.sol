pragma solidity ^0.5.1;
import "@gnosis.pm/hg-contracts/contracts/PredictionMarketSystem.sol";

contract Medianizer {
    function read() external view returns (bytes32);
}

contract ETHValueBlockOracle {
    PredictionMarketSystem public pmSystem;
    Medianizer public priceFeed;
    uint public startBlock;
    uint public endBlock;
    bytes32 public questionId;

    constructor (PredictionMarketSystem _pmSystem, Medianizer _priceFeed, uint _startBlock, uint _endBlock, bytes32 _questionId) public {
        pmSystem = PredictionMarketSystem(_pmSystem);
        priceFeed = Medianizer(_priceFeed);
        startBlock = _startBlock;
        endBlock = _endBlock;
        questionId = _questionId;
    }

    function resolveETHValue() public {
        uint currentBlock;
        
        assembly {
            currentBlock := currentBlock
        }

        if(currentBlock >= startBlock && currentBlock <= endBlock) {
            bytes memory price = abi.encodePacked(priceFeed.read());
            pmSystem.receiveResult(questionId, price);
        }

        revert("Not the correct range of blocks.");
    }
}