pragma solidity ^0.5.1;
import { ConditionalTokens } from "@gnosis.pm/conditional-tokens-contracts/contracts/ConditionalTokens.sol";
import { TargetValueOracle } from "./TargetValueOracle.sol";

interface Medianizer {
    function read() external view returns (bytes32);
}

contract ETHValueOracle is TargetValueOracle {
    /// Price feed which this oracle uses to price Ether
    Medianizer public priceFeed;

    constructor (
        ConditionalTokens pmSystem,
        Medianizer _priceFeed,
        uint resolutionTime,
        uint targetETHPrice,
        bytes32 questionId
    ) public TargetValueOracle(pmSystem, resolutionTime, targetETHPrice, questionId) {
        priceFeed = _priceFeed;
    }

    function readValue() internal returns(uint) {
        return uint(priceFeed.read());
    }
}
