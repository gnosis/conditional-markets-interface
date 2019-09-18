pragma solidity ^0.5.1;

// NOTE: This file porpouse is just to make sure truffle compiles all of depending
//  contracts when we are in development.

import '@gnosis.pm/conditional-tokens-market-makers/contracts/LMSRMarketMaker.sol';
import '@gnosis.pm/conditional-tokens-market-makers/contracts/LMSRMarketMakerFactory.sol';
import '@gnosis.pm/conditional-tokens-market-makers/contracts/Whitelist.sol';
import 'canonical-weth/contracts/WETH9.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';

contract CoolAppDependencies {
}
