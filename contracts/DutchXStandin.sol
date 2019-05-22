pragma solidity ^0.5.1;

import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { IDSValue, IETHUSDOracle, IDutchX } from "./DutchXTokenPriceOracle.sol";

contract MedianizerStandin is IDSValue {
    function peek() external view returns (bytes32, bool) {
        return (bytes32(uint(244195000000000000000)), true);
    }
}

contract ETHUSDOracleStandin is IETHUSDOracle {
    MedianizerStandin internal source;

    constructor() public {
        source = new MedianizerStandin();
    }

    function priceFeedSource() external view returns (IDSValue) {
        return source;
    }
}

contract DutchXStandin is IDutchX {
    ETHUSDOracleStandin internal oracle;

    constructor() public {
        oracle = new ETHUSDOracleStandin();
    }

    function ethUSDOracle() external view returns (IETHUSDOracle) {
        return oracle;
    }

    function getPriceOfTokenInLastAuction(IERC20 /* token */) external view returns (uint num, uint den) {
        return (5985000000000000000, 1514929708384049525858);
    }
}
