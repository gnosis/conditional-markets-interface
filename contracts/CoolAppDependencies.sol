pragma solidity ^0.5.1;

// NOTE: This file porpouse is just to make sure truffle compiles all of depending
//  contracts when we are in development.

import '@gnosis.pm/hg-market-makers/contracts/LMSRMarketMaker.sol';
import '@gnosis.pm/hg-market-makers/contracts/LMSRMarketMakerFactory.sol';
import 'canonical-weth/contracts/WETH9.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol';

contract CoolAppDependencies { 
}