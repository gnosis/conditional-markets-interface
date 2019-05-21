pragma solidity ^0.5.1;

import { ERC20Mintable } from "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import { IDSToken } from "./IDSToken.sol";

contract DaiStandin is IDSToken, ERC20Mintable, Ownable {
    function name() external view returns (bytes32) { return bytes32("Dai Stablecoin v1.0"); }
    function symbol() external view returns (bytes32) { return bytes32("DAI"); }
    function decimals() external view returns (uint) { return 18; }
}
