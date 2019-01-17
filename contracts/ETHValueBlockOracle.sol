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
    uint public ethTarget;
    bytes32 public questionId;

    constructor (PredictionMarketSystem _pmSystem, Medianizer _priceFeed, uint _startBlock, uint _endBlock, uint _ethTarget, bytes32 _questionId) public {
        pmSystem = PredictionMarketSystem(_pmSystem);
        priceFeed = Medianizer(_priceFeed);
        startBlock = _startBlock;
        endBlock = _endBlock;
        ethTarget = _ethTarget;
        questionId = _questionId;
    }

    function resolveETHValue() public returns(uint) {
        uint currentBlock;
        bytes32 price = priceFeed.read();
        
        assembly {
            currentBlock := currentBlock
        }

        if (currentBlock >= startBlock && currentBlock <= endBlock) {
            if (uint(price) > ethTarget) {
                pmSystem.receiveResult(questionId, abi.encodePacked(bytes32(0), bytes32(uint(1))));
                return uint(price);
            }
            pmSystem.receiveResult(questionId, abi.encodePacked(bytes32(uint(1)), bytes32(0)));
            return uint(price);
        }

        revert("Not the correct range of blocks.");
    }
}