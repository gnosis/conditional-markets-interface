pragma solidity ^0.5.1;

contract Medianizer {
    function read() external view returns (bytes32) {
      uint testValue = 199210000000000000000;
      return bytes32(testValue);
    }
}