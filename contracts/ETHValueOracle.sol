pragma solidity ^0.5.1;
import "@gnosis.pm/hg-contracts/contracts/PredictionMarketSystem.sol";
import "./TestMedianizer.sol";

contract ETHValueOracle {
    /// Prediction market system this oracle reports to.
    PredictionMarketSystem public pmSystem;
    /// Price feed which this oracle uses to price Ether
    Medianizer public priceFeed;
    /// Beginning of time window in which valid reports may be generated. Value is inclusive, meaning that the first valid timestamp is this.
    uint public startTime;
    /// End of time window in which valid reports may be generated. Value is inclusive, meaning that the last valid timestamp is this.
    uint public endTime;
    /// Target ETH price at which oracle would report a full value in the first slot if the actual ETH price according to the medianizer was less than or equal to this target, and a full value in the second slot if the actual ETH price exceeded the target. This value is in the same units as the Medianizer#read function's result.
    uint public ethTarget;
    /// Question ID oracle will use during report to the prediction market system.
    bytes32 public questionId;

    /// @dev Emitted upon the successful reporting of whether the ETH price has exceeded the ETH price target to the prediction market system.
    /// @param startTime Beginning of time window in which valid reports may be generated. (AUDIT: duplicate of storage var)
    /// @param endTime End of time window in which valid reports may be generated. (AUDIT: duplicate of storage var)
    /// @param currentTime Time at which this oracle made a determination of the ETH price level.
    /// @param price The ETH price level found by this contract during the reporting of the ETH price level.
    event resolutionSuccessful(uint startTime, uint endTime, uint currentTime, uint price);
    // (AUDIT: This event never gets emitted)
    event resolutionFailed(uint startTime, uint endTime, uint currentTime, uint price);

    constructor (PredictionMarketSystem _pmSystem, Medianizer _priceFeed, uint _startTime, uint _endTime, uint _ethTarget, bytes32 _questionId) public {
        pmSystem = PredictionMarketSystem(_pmSystem);
        priceFeed = Medianizer(_priceFeed);
        startTime = _startTime;
        endTime = _endTime;
        ethTarget = _ethTarget;
        questionId = _questionId;
    }

    /// @dev Triggers an oracle report. If the transaction occurs within the prescribed valid time window, the oracle will attempt to read an ETH price from the medianizer and report a result to the prediction market system. The result reported will be two EVM words (2*32=64 bytes). If the witnessed ETH price exceeds the target ETH price, the first word will be 0 and the second will be 1. Otherwise, if the witnessed ETH price is less than or equal to the target ETH price, the first word will be 1 and the second will be 0. (AUDIT: this function's visibility can be limited to external)
    /// @return ETH price witnessed by this oracle (AUDIT: no return is necessary)
    function resolveETHValue() public returns(uint) {
        // AUDIT: use block.timestamp property directly instead of pushing new variables on the stack for efficiency. priceFeed.read() expensive enough to be worth putting on the stack though.
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