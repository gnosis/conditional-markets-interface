pragma solidity ^0.5.1;
import '@gnosis.pm/hg-contracts/contracts/PredictionMarketSystem.sol';

contract Medianizer {
    function read() external view returns (bytes32);
}

contract ETHValueOracle {
    PredictionMarketSystem public pms;
    Medianizer public priceFeed;
    uint public blockNum;
    bytes32 public questionId;
    bytes public price;

    constructor (PredictionMarketSystem _pms, Medianizer _priceFeed, uint _blockNum, bytes32 _questionId) public {
        pms = PredictionMarketSystem(_pms);
        priceFeed = Medianizer(_priceFeed);
        blockNum = _blockNum;
        questionId = _questionId;
    }

    function resolveETHValue() public {
        uint currentBlock;
        assembly {
            currentBlock := currentBlock
        }

        if(currentBlock == blockNum) {
            price = abi.encodePacked(priceFeed.read());
            pms.receiveResult(questionId, price);
        }

        revert('Not the correct current block');
    }
}