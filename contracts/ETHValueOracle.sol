pragma solidity ^0.5.1;
import { PredictionMarketSystem } from "@gnosis.pm/hg-contracts/contracts/PredictionMarketSystem.sol";
import { TargetValueOracle } from "./TargetValueOracle.sol";

interface Medianizer {
    function read() external view returns (bytes32);
}

contract ETHValueOracle is TargetValueOracle {
    /// Price feed which this oracle uses to price Ether
    Medianizer public priceFeed;

    constructor (
        PredictionMarketSystem pmSystem,
        Medianizer _priceFeed,
        uint startTime,
        uint endTime,
        uint targetETHPrice,
        bytes32 questionId
    ) public TargetValueOracle(pmSystem, startTime, endTime, targetETHPrice, questionId) {
        priceFeed = _priceFeed;
    }

    function readValue() internal returns(uint) {
        return uint(priceFeed.read());
    }
}
