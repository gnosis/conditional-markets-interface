pragma solidity ^0.5.1;

import { ConditionalTokens } from "@gnosis.pm/conditional-tokens-contracts/contracts/ConditionalTokens.sol";
import { TargetValueOracle } from "./TargetValueOracle.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract TokenSupplyOracle is TargetValueOracle {
    IERC20 token;

    constructor (
        ConditionalTokens pmSystem,
        uint resolutionTime,
        uint difficultyTarget,
        bytes32 questionId,
        IERC20 _token
    ) public TargetValueOracle(pmSystem, resolutionTime, difficultyTarget, questionId) {
        token = _token;
    }

    function readValue() internal returns(uint) {
        return token.totalSupply();
    }
}
