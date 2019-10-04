pragma solidity ^0.5.1;

import { ConditionalTokens } from "@gnosis.pm/conditional-tokens-contracts/contracts/ConditionalTokens.sol";
import { TargetValueOracle } from "./TargetValueOracle.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

interface IDSValue {
    function peek() external view returns (bytes32, bool);
}

interface IETHUSDOracle {
    function priceFeedSource() external view returns (IDSValue);
}

interface IDutchX {
    function ethUSDOracle() external view returns (IETHUSDOracle);
    function getPriceOfTokenInLastAuction(IERC20 token) external view returns (uint num, uint den);
}

contract DutchXTokenPriceOracle is TargetValueOracle {
    IDutchX public dutchX;
    IERC20 public token;

    constructor (
        ConditionalTokens pmSystem,
        uint resolutionTime,
        uint difficultyTarget,
        bytes32 questionId,
        IDutchX _dutchX,
        IERC20 _token
    ) public TargetValueOracle(pmSystem, resolutionTime, difficultyTarget, questionId) {
        dutchX = _dutchX;
        token = _token;
    }

    function readValue() internal returns(uint) {
        (bytes32 ethUSDPrice,) = dutchX.ethUSDOracle().priceFeedSource().peek();
        (uint num, uint den) = dutchX.getPriceOfTokenInLastAuction(token);
        return uint(ethUSDPrice) * num / den;
    }
}
