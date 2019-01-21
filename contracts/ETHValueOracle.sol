pragma solidity ^0.5.1;
import "@gnosis.pm/hg-contracts/contracts/PredictionMarketSystem.sol";

contract Medianizer {
    function read() external view returns (bytes32);
}

contract ETHValueOracle {
    PredictionMarketSystem public pmSystem;
    Medianizer public priceFeed;
    uint public startTime;
    uint public endTime;
    uint public ethTarget;
    bytes32 public questionId;

    event resolutionSuccessful(uint startTime, uint endTime, uint currentTime, uint price);
    event resolutionFailed(uint startTime, uint endTime, uint currentTime, uint price);

    constructor (PredictionMarketSystem _pmSystem, Medianizer _priceFeed, uint _startTime, uint _endTime, uint _ethTarget, bytes32 _questionId) public {
        pmSystem = PredictionMarketSystem(_pmSystem);
        priceFeed = Medianizer(_priceFeed);
        startTime = _startTime;
        endTime = _endTime;
        ethTarget = _ethTarget;
        questionId = _questionId;
    }

    function resolveETHValue() public returns(uint) {
        uint currentTime = block.timestamp;
        bytes32 price = priceFeed.read();

        if (currentTime >= startTime && currentTime <= endTime) {
            if (uint(price) > ethTarget) {
                pmSystem.receiveResult(questionId, abi.encodePacked(bytes32(0), bytes32(uint(1))));
                emit resolutionSuccessful(startTime, endTime, currentTime, uint(price));
                return uint(price);
            }
            pmSystem.receiveResult(questionId, abi.encodePacked(bytes32(uint(1)), bytes32(0)));
            emit resolutionSuccessful(startTime, endTime, currentTime, uint(price));
            return uint(price);
        }
        emit resolutionFailed(startTime, endTime, currentTime, uint(price));
        revert("Please submit a resolution during the correct time interval");
    }
}