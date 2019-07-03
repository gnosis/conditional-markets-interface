(window.webpackJsonp=window.webpackJsonp||[]).push([[20],{13:function(module){eval('module.exports = {"contractName":"PredictionMarketSystem","abi":[{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"id","type":"uint256"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x00fdd58e"},{"constant":true,"inputs":[{"name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x01ffc9a7"},{"constant":true,"inputs":[{"name":"","type":"bytes32"},{"name":"","type":"uint256"}],"name":"payoutNumerators","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x0504c814"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"ids","type":"uint256[]"},{"name":"values","type":"uint256[]"},{"name":"data","type":"bytes"}],"name":"safeBatchTransferFrom","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0x2eb2c2d6"},{"constant":true,"inputs":[{"name":"owners","type":"address[]"},{"name":"ids","type":"uint256[]"}],"name":"balanceOfBatch","outputs":[{"name":"","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x4e1273f4"},{"constant":false,"inputs":[{"name":"operator","type":"address"},{"name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0xa22cb465"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"payoutDenominator","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function","signature":"0xdd34de67"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function","signature":"0xe985e9c5"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"id","type":"uint256"},{"name":"value","type":"uint256"},{"name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0xf242432a"},{"anonymous":false,"inputs":[{"indexed":true,"name":"conditionId","type":"bytes32"},{"indexed":true,"name":"oracle","type":"address"},{"indexed":true,"name":"questionId","type":"bytes32"},{"indexed":false,"name":"outcomeSlotCount","type":"uint256"}],"name":"ConditionPreparation","type":"event","signature":"0xab3760c3bd2bb38b5bcf54dc79802ed67338b4cf29f3054ded67ed24661e4177"},{"anonymous":false,"inputs":[{"indexed":true,"name":"conditionId","type":"bytes32"},{"indexed":true,"name":"oracle","type":"address"},{"indexed":true,"name":"questionId","type":"bytes32"},{"indexed":false,"name":"outcomeSlotCount","type":"uint256"},{"indexed":false,"name":"payoutNumerators","type":"uint256[]"}],"name":"ConditionResolution","type":"event","signature":"0xb44d84d3289691f71497564b85d4233648d9dbae8cbdbb4329f301c3a0185894"},{"anonymous":false,"inputs":[{"indexed":true,"name":"stakeholder","type":"address"},{"indexed":false,"name":"collateralToken","type":"address"},{"indexed":true,"name":"parentCollectionId","type":"bytes32"},{"indexed":true,"name":"conditionId","type":"bytes32"},{"indexed":false,"name":"partition","type":"uint256[]"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"PositionSplit","type":"event","signature":"0x2e6bb91f8cbcda0c93623c54d0403a43514fabc40084ec96b6d5379a74786298"},{"anonymous":false,"inputs":[{"indexed":true,"name":"stakeholder","type":"address"},{"indexed":false,"name":"collateralToken","type":"address"},{"indexed":true,"name":"parentCollectionId","type":"bytes32"},{"indexed":true,"name":"conditionId","type":"bytes32"},{"indexed":false,"name":"partition","type":"uint256[]"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"PositionsMerge","type":"event","signature":"0x6f13ca62553fcc2bcd2372180a43949c1e4cebba603901ede2f4e14f36b282ca"},{"anonymous":false,"inputs":[{"indexed":true,"name":"redeemer","type":"address"},{"indexed":true,"name":"collateralToken","type":"address"},{"indexed":true,"name":"parentCollectionId","type":"bytes32"},{"indexed":false,"name":"conditionId","type":"bytes32"},{"indexed":false,"name":"indexSets","type":"uint256[]"},{"indexed":false,"name":"payout","type":"uint256"}],"name":"PayoutRedemption","type":"event","signature":"0x2682012a4a4f1973119f1c9b90745d1bd91fa2bab387344f044cb3586864d18d"},{"anonymous":false,"inputs":[{"indexed":true,"name":"operator","type":"address"},{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"id","type":"uint256"},{"indexed":false,"name":"value","type":"uint256"}],"name":"TransferSingle","type":"event","signature":"0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62"},{"anonymous":false,"inputs":[{"indexed":true,"name":"operator","type":"address"},{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"ids","type":"uint256[]"},{"indexed":false,"name":"values","type":"uint256[]"}],"name":"TransferBatch","type":"event","signature":"0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"operator","type":"address"},{"indexed":false,"name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event","signature":"0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31"},{"anonymous":false,"inputs":[{"indexed":false,"name":"value","type":"string"},{"indexed":true,"name":"id","type":"uint256"}],"name":"URI","type":"event","signature":"0x6bb7ff708619ba0610cba295a58592e0451dee2622938c8755667688daf3529b"},{"constant":false,"inputs":[{"name":"oracle","type":"address"},{"name":"questionId","type":"bytes32"},{"name":"outcomeSlotCount","type":"uint256"}],"name":"prepareCondition","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0xd96ee754"},{"constant":false,"inputs":[{"name":"questionId","type":"bytes32"},{"name":"result","type":"bytes"}],"name":"receiveResult","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0x5dd80855"},{"constant":false,"inputs":[{"name":"collateralToken","type":"address"},{"name":"parentCollectionId","type":"bytes32"},{"name":"conditionId","type":"bytes32"},{"name":"partition","type":"uint256[]"},{"name":"amount","type":"uint256"}],"name":"splitPosition","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0x72ce4275"},{"constant":false,"inputs":[{"name":"collateralToken","type":"address"},{"name":"parentCollectionId","type":"bytes32"},{"name":"conditionId","type":"bytes32"},{"name":"partition","type":"uint256[]"},{"name":"amount","type":"uint256"}],"name":"mergePositions","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0x9e7212ad"},{"constant":false,"inputs":[{"name":"collateralToken","type":"address"},{"name":"parentCollectionId","type":"bytes32"},{"name":"conditionId","type":"bytes32"},{"name":"indexSets","type":"uint256[]"}],"name":"redeemPositions","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0x01b7037c"},{"constant":true,"inputs":[{"name":"conditionId","type":"bytes32"}],"name":"getOutcomeSlotCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function","signature":"0xd42dc0c2"}],"metadata":"{\\"compiler\\":{\\"version\\":\\"0.5.1+commit.c8a2cb62\\"},\\"language\\":\\"Solidity\\",\\"output\\":{\\"abi\\":[{\\"constant\\":true,\\"inputs\\":[{\\"name\\":\\"owner\\",\\"type\\":\\"address\\"},{\\"name\\":\\"id\\",\\"type\\":\\"uint256\\"}],\\"name\\":\\"balanceOf\\",\\"outputs\\":[{\\"name\\":\\"\\",\\"type\\":\\"uint256\\"}],\\"payable\\":false,\\"stateMutability\\":\\"view\\",\\"type\\":\\"function\\"},{\\"constant\\":false,\\"inputs\\":[{\\"name\\":\\"collateralToken\\",\\"type\\":\\"address\\"},{\\"name\\":\\"parentCollectionId\\",\\"type\\":\\"bytes32\\"},{\\"name\\":\\"conditionId\\",\\"type\\":\\"bytes32\\"},{\\"name\\":\\"indexSets\\",\\"type\\":\\"uint256[]\\"}],\\"name\\":\\"redeemPositions\\",\\"outputs\\":[],\\"payable\\":false,\\"stateMutability\\":\\"nonpayable\\",\\"type\\":\\"function\\"},{\\"constant\\":true,\\"inputs\\":[{\\"name\\":\\"interfaceId\\",\\"type\\":\\"bytes4\\"}],\\"name\\":\\"supportsInterface\\",\\"outputs\\":[{\\"name\\":\\"\\",\\"type\\":\\"bool\\"}],\\"payable\\":false,\\"stateMutability\\":\\"view\\",\\"type\\":\\"function\\"},{\\"constant\\":true,\\"inputs\\":[{\\"name\\":\\"\\",\\"type\\":\\"bytes32\\"},{\\"name\\":\\"\\",\\"type\\":\\"uint256\\"}],\\"name\\":\\"payoutNumerators\\",\\"outputs\\":[{\\"name\\":\\"\\",\\"type\\":\\"uint256\\"}],\\"payable\\":false,\\"stateMutability\\":\\"view\\",\\"type\\":\\"function\\"},{\\"constant\\":false,\\"inputs\\":[{\\"name\\":\\"from\\",\\"type\\":\\"address\\"},{\\"name\\":\\"to\\",\\"type\\":\\"address\\"},{\\"name\\":\\"ids\\",\\"type\\":\\"uint256[]\\"},{\\"name\\":\\"values\\",\\"type\\":\\"uint256[]\\"},{\\"name\\":\\"data\\",\\"type\\":\\"bytes\\"}],\\"name\\":\\"safeBatchTransferFrom\\",\\"outputs\\":[],\\"payable\\":false,\\"stateMutability\\":\\"nonpayable\\",\\"type\\":\\"function\\"},{\\"constant\\":true,\\"inputs\\":[{\\"name\\":\\"owners\\",\\"type\\":\\"address[]\\"},{\\"name\\":\\"ids\\",\\"type\\":\\"uint256[]\\"}],\\"name\\":\\"balanceOfBatch\\",\\"outputs\\":[{\\"name\\":\\"\\",\\"type\\":\\"uint256[]\\"}],\\"payable\\":false,\\"stateMutability\\":\\"view\\",\\"type\\":\\"function\\"},{\\"constant\\":false,\\"inputs\\":[{\\"name\\":\\"questionId\\",\\"type\\":\\"bytes32\\"},{\\"name\\":\\"result\\",\\"type\\":\\"bytes\\"}],\\"name\\":\\"receiveResult\\",\\"outputs\\":[],\\"payable\\":false,\\"stateMutability\\":\\"nonpayable\\",\\"type\\":\\"function\\"},{\\"constant\\":false,\\"inputs\\":[{\\"name\\":\\"collateralToken\\",\\"type\\":\\"address\\"},{\\"name\\":\\"parentCollectionId\\",\\"type\\":\\"bytes32\\"},{\\"name\\":\\"conditionId\\",\\"type\\":\\"bytes32\\"},{\\"name\\":\\"partition\\",\\"type\\":\\"uint256[]\\"},{\\"name\\":\\"amount\\",\\"type\\":\\"uint256\\"}],\\"name\\":\\"splitPosition\\",\\"outputs\\":[],\\"payable\\":false,\\"stateMutability\\":\\"nonpayable\\",\\"type\\":\\"function\\"},{\\"constant\\":false,\\"inputs\\":[{\\"name\\":\\"collateralToken\\",\\"type\\":\\"address\\"},{\\"name\\":\\"parentCollectionId\\",\\"type\\":\\"bytes32\\"},{\\"name\\":\\"conditionId\\",\\"type\\":\\"bytes32\\"},{\\"name\\":\\"partition\\",\\"type\\":\\"uint256[]\\"},{\\"name\\":\\"amount\\",\\"type\\":\\"uint256\\"}],\\"name\\":\\"mergePositions\\",\\"outputs\\":[],\\"payable\\":false,\\"stateMutability\\":\\"nonpayable\\",\\"type\\":\\"function\\"},{\\"constant\\":false,\\"inputs\\":[{\\"name\\":\\"operator\\",\\"type\\":\\"address\\"},{\\"name\\":\\"approved\\",\\"type\\":\\"bool\\"}],\\"name\\":\\"setApprovalForAll\\",\\"outputs\\":[],\\"payable\\":false,\\"stateMutability\\":\\"nonpayable\\",\\"type\\":\\"function\\"},{\\"constant\\":true,\\"inputs\\":[{\\"name\\":\\"conditionId\\",\\"type\\":\\"bytes32\\"}],\\"name\\":\\"getOutcomeSlotCount\\",\\"outputs\\":[{\\"name\\":\\"\\",\\"type\\":\\"uint256\\"}],\\"payable\\":false,\\"stateMutability\\":\\"view\\",\\"type\\":\\"function\\"},{\\"constant\\":false,\\"inputs\\":[{\\"name\\":\\"oracle\\",\\"type\\":\\"address\\"},{\\"name\\":\\"questionId\\",\\"type\\":\\"bytes32\\"},{\\"name\\":\\"outcomeSlotCount\\",\\"type\\":\\"uint256\\"}],\\"name\\":\\"prepareCondition\\",\\"outputs\\":[],\\"payable\\":false,\\"stateMutability\\":\\"nonpayable\\",\\"type\\":\\"function\\"},{\\"constant\\":true,\\"inputs\\":[{\\"name\\":\\"\\",\\"type\\":\\"bytes32\\"}],\\"name\\":\\"payoutDenominator\\",\\"outputs\\":[{\\"name\\":\\"\\",\\"type\\":\\"uint256\\"}],\\"payable\\":false,\\"stateMutability\\":\\"view\\",\\"type\\":\\"function\\"},{\\"constant\\":true,\\"inputs\\":[{\\"name\\":\\"owner\\",\\"type\\":\\"address\\"},{\\"name\\":\\"operator\\",\\"type\\":\\"address\\"}],\\"name\\":\\"isApprovedForAll\\",\\"outputs\\":[{\\"name\\":\\"\\",\\"type\\":\\"bool\\"}],\\"payable\\":false,\\"stateMutability\\":\\"view\\",\\"type\\":\\"function\\"},{\\"constant\\":false,\\"inputs\\":[{\\"name\\":\\"from\\",\\"type\\":\\"address\\"},{\\"name\\":\\"to\\",\\"type\\":\\"address\\"},{\\"name\\":\\"id\\",\\"type\\":\\"uint256\\"},{\\"name\\":\\"value\\",\\"type\\":\\"uint256\\"},{\\"name\\":\\"data\\",\\"type\\":\\"bytes\\"}],\\"name\\":\\"safeTransferFrom\\",\\"outputs\\":[],\\"payable\\":false,\\"stateMutability\\":\\"nonpayable\\",\\"type\\":\\"function\\"},{\\"anonymous\\":false,\\"inputs\\":[{\\"indexed\\":true,\\"name\\":\\"conditionId\\",\\"type\\":\\"bytes32\\"},{\\"indexed\\":true,\\"name\\":\\"oracle\\",\\"type\\":\\"address\\"},{\\"indexed\\":true,\\"name\\":\\"questionId\\",\\"type\\":\\"bytes32\\"},{\\"indexed\\":false,\\"name\\":\\"outcomeSlotCount\\",\\"type\\":\\"uint256\\"}],\\"name\\":\\"ConditionPreparation\\",\\"type\\":\\"event\\"},{\\"anonymous\\":false,\\"inputs\\":[{\\"indexed\\":true,\\"name\\":\\"conditionId\\",\\"type\\":\\"bytes32\\"},{\\"indexed\\":true,\\"name\\":\\"oracle\\",\\"type\\":\\"address\\"},{\\"indexed\\":true,\\"name\\":\\"questionId\\",\\"type\\":\\"bytes32\\"},{\\"indexed\\":false,\\"name\\":\\"outcomeSlotCount\\",\\"type\\":\\"uint256\\"},{\\"indexed\\":false,\\"name\\":\\"payoutNumerators\\",\\"type\\":\\"uint256[]\\"}],\\"name\\":\\"ConditionResolution\\",\\"type\\":\\"event\\"},{\\"anonymous\\":false,\\"inputs\\":[{\\"indexed\\":true,\\"name\\":\\"stakeholder\\",\\"type\\":\\"address\\"},{\\"indexed\\":false,\\"name\\":\\"collateralToken\\",\\"type\\":\\"address\\"},{\\"indexed\\":true,\\"name\\":\\"parentCollectionId\\",\\"type\\":\\"bytes32\\"},{\\"indexed\\":true,\\"name\\":\\"conditionId\\",\\"type\\":\\"bytes32\\"},{\\"indexed\\":false,\\"name\\":\\"partition\\",\\"type\\":\\"uint256[]\\"},{\\"indexed\\":false,\\"name\\":\\"amount\\",\\"type\\":\\"uint256\\"}],\\"name\\":\\"PositionSplit\\",\\"type\\":\\"event\\"},{\\"anonymous\\":false,\\"inputs\\":[{\\"indexed\\":true,\\"name\\":\\"stakeholder\\",\\"type\\":\\"address\\"},{\\"indexed\\":false,\\"name\\":\\"collateralToken\\",\\"type\\":\\"address\\"},{\\"indexed\\":true,\\"name\\":\\"parentCollectionId\\",\\"type\\":\\"bytes32\\"},{\\"indexed\\":true,\\"name\\":\\"conditionId\\",\\"type\\":\\"bytes32\\"},{\\"indexed\\":false,\\"name\\":\\"partition\\",\\"type\\":\\"uint256[]\\"},{\\"indexed\\":false,\\"name\\":\\"amount\\",\\"type\\":\\"uint256\\"}],\\"name\\":\\"PositionsMerge\\",\\"type\\":\\"event\\"},{\\"anonymous\\":false,\\"inputs\\":[{\\"indexed\\":true,\\"name\\":\\"redeemer\\",\\"type\\":\\"address\\"},{\\"indexed\\":true,\\"name\\":\\"collateralToken\\",\\"type\\":\\"address\\"},{\\"indexed\\":true,\\"name\\":\\"parentCollectionId\\",\\"type\\":\\"bytes32\\"},{\\"indexed\\":false,\\"name\\":\\"conditionId\\",\\"type\\":\\"bytes32\\"},{\\"indexed\\":false,\\"name\\":\\"indexSets\\",\\"type\\":\\"uint256[]\\"},{\\"indexed\\":false,\\"name\\":\\"payout\\",\\"type\\":\\"uint256\\"}],\\"name\\":\\"PayoutRedemption\\",\\"type\\":\\"event\\"},{\\"anonymous\\":false,\\"inputs\\":[{\\"indexed\\":true,\\"name\\":\\"operator\\",\\"type\\":\\"address\\"},{\\"indexed\\":true,\\"name\\":\\"from\\",\\"type\\":\\"address\\"},{\\"indexed\\":true,\\"name\\":\\"to\\",\\"type\\":\\"address\\"},{\\"indexed\\":false,\\"name\\":\\"id\\",\\"type\\":\\"uint256\\"},{\\"indexed\\":false,\\"name\\":\\"value\\",\\"type\\":\\"uint256\\"}],\\"name\\":\\"TransferSingle\\",\\"type\\":\\"event\\"},{\\"anonymous\\":false,\\"inputs\\":[{\\"indexed\\":true,\\"name\\":\\"operator\\",\\"type\\":\\"address\\"},{\\"indexed\\":true,\\"name\\":\\"from\\",\\"type\\":\\"address\\"},{\\"indexed\\":true,\\"name\\":\\"to\\",\\"type\\":\\"address\\"},{\\"indexed\\":false,\\"name\\":\\"ids\\",\\"type\\":\\"uint256[]\\"},{\\"indexed\\":false,\\"name\\":\\"values\\",\\"type\\":\\"uint256[]\\"}],\\"name\\":\\"TransferBatch\\",\\"type\\":\\"event\\"},{\\"anonymous\\":false,\\"inputs\\":[{\\"indexed\\":true,\\"name\\":\\"owner\\",\\"type\\":\\"address\\"},{\\"indexed\\":true,\\"name\\":\\"operator\\",\\"type\\":\\"address\\"},{\\"indexed\\":false,\\"name\\":\\"approved\\",\\"type\\":\\"bool\\"}],\\"name\\":\\"ApprovalForAll\\",\\"type\\":\\"event\\"},{\\"anonymous\\":false,\\"inputs\\":[{\\"indexed\\":false,\\"name\\":\\"value\\",\\"type\\":\\"string\\"},{\\"indexed\\":true,\\"name\\":\\"id\\",\\"type\\":\\"uint256\\"}],\\"name\\":\\"URI\\",\\"type\\":\\"event\\"}],\\"devdoc\\":{\\"methods\\":{\\"balanceOf(address,uint256)\\":{\\"details\\":\\"Get the specified address\' balance for token with specified ID.\\",\\"params\\":{\\"id\\":\\"ID of the token\\",\\"owner\\":\\"The address of the token holder\\"},\\"return\\":\\"The owner\'s balance of the token type requested\\"},\\"balanceOfBatch(address[],uint256[])\\":{\\"details\\":\\"Get the balance of multiple account/token pairs\\",\\"params\\":{\\"ids\\":\\"IDs of the tokens\\",\\"owners\\":\\"The addresses of the token holders\\"},\\"return\\":\\"Balances for each owner and token id pair\\"},\\"getOutcomeSlotCount(bytes32)\\":{\\"details\\":\\"Gets the outcome slot count of a condition.\\",\\"params\\":{\\"conditionId\\":\\"ID of the condition.\\"},\\"return\\":\\"Number of outcome slots associated with a condition, or zero if condition has not been prepared yet.\\"},\\"isApprovedForAll(address,address)\\":{\\"params\\":{\\"operator\\":\\"Address of authorized operator\\",\\"owner\\":\\"The owner of the Tokens\\"},\\"return\\":\\"True if the operator is approved, false if not\\"},\\"prepareCondition(address,bytes32,uint256)\\":{\\"details\\":\\"This function prepares a condition by initializing a payout vector associated with the condition.\\",\\"params\\":{\\"oracle\\":\\"The account assigned to report the result for the prepared condition.\\",\\"outcomeSlotCount\\":\\"The number of outcome slots which should be used for this condition. Must not exceed 256.\\",\\"questionId\\":\\"An identifier for the question to be answered by the oracle.\\"}},\\"receiveResult(bytes32,bytes)\\":{\\"details\\":\\"Called by the oracle for reporting results of conditions. Will set the payout vector for the condition with the ID ``keccak256(abi.encodePacked(oracle, questionId, outcomeSlotCount))``, where oracle is the message sender, questionId is one of the parameters of this function, and outcomeSlotCount is derived from result, which is the result of serializing 32-byte EVM words representing payoutNumerators for each outcome slot of the condition.\\",\\"params\\":{\\"questionId\\":\\"The question ID the oracle is answering for\\",\\"result\\":\\"The oracle\'s answer\\"}},\\"safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)\\":{\\"details\\":\\"Transfers `values` amount(s) of `ids` from the `from` address to the `to` address specified. Caller must be approved to manage the tokens being transferred out of the `from` account. If `to` is a smart contract, will call `onERC1155BatchReceived` on `to` and act appropriately.\\",\\"params\\":{\\"data\\":\\"Data forwarded to `onERC1155Received` if `to` is a contract receiver\\",\\"from\\":\\"Source address\\",\\"ids\\":\\"IDs of each token type\\",\\"to\\":\\"Target address\\",\\"values\\":\\"Transfer amounts per token type\\"}},\\"safeTransferFrom(address,address,uint256,uint256,bytes)\\":{\\"details\\":\\"Transfers `value` amount of an `id` from the `from` address to the `to` address specified. Caller must be approved to manage the tokens being transferred out of the `from` account. If `to` is a smart contract, will call `onERC1155Received` on `to` and act appropriately.\\",\\"params\\":{\\"data\\":\\"Data forwarded to `onERC1155Received` if `to` is a contract receiver\\",\\"from\\":\\"Source address\\",\\"id\\":\\"ID of the token type\\",\\"to\\":\\"Target address\\",\\"value\\":\\"Transfer amount\\"}},\\"setApprovalForAll(address,bool)\\":{\\"details\\":\\"Sets or unsets the approval of a given operator An operator is allowed to transfer all tokens of the sender on their behalf\\",\\"params\\":{\\"approved\\":\\"representing the status of the approval to be set\\",\\"operator\\":\\"address to set the approval\\"}},\\"splitPosition(address,bytes32,bytes32,uint256[],uint256)\\":{\\"details\\":\\"This function splits a position. If splitting from the collateral, this contract will attempt to transfer `amount` collateral from the message sender to itself. Otherwise, this contract will burn `amount` stake held by the message sender in the position being split. Regardless, if successful, `amount` stake will be minted in the split target positions. If any of the transfers, mints, or burns fail, the transaction will revert. The transaction will also revert if the given partition is trivial, invalid, or refers to more slots than the condition is prepared with.\\",\\"params\\":{\\"amount\\":\\"The amount of collateral or stake to split.\\",\\"collateralToken\\":\\"The address of the positions\' backing collateral token.\\",\\"conditionId\\":\\"The ID of the condition to split on.\\",\\"parentCollectionId\\":\\"The ID of the outcome collections common to the position being split and the split target positions. May be null, in which only the collateral is shared.\\",\\"partition\\":\\"An array of disjoint index sets representing a nontrivial partition of the outcome slots of the given condition.\\"}},\\"supportsInterface(bytes4)\\":{\\"details\\":\\"See `IERC165.supportsInterface`.     * Time complexity O(1), guaranteed to always use less than 30 000 gas.\\"}}},\\"userdoc\\":{\\"methods\\":{\\"isApprovedForAll(address,address)\\":{\\"notice\\":\\"Queries the approval status of an operator for a given owner.\\"}}}},\\"settings\\":{\\"compilationTarget\\":{\\"@gnosis.pm/hg-contracts/contracts/PredictionMarketSystem.sol\\":\\"PredictionMarketSystem\\"},\\"evmVersion\\":\\"byzantium\\",\\"libraries\\":{},\\"optimizer\\":{\\"enabled\\":false,\\"runs\\":200},\\"remappings\\":[]},\\"sources\\":{\\"@gnosis.pm/hg-contracts/contracts/ERC1155/ERC1155.sol\\":{\\"keccak256\\":\\"0xb5ea3de07ac2eaed47e0e14c8369ce49912760864ee85ec9e08814d46935c2b3\\",\\"urls\\":[\\"bzzr://965d03a98d17c4df4d9700eb2dc1838226a273d721b1117f645e29f9d4eb87a3\\"]},\\"@gnosis.pm/hg-contracts/contracts/ERC1155/IERC1155.sol\\":{\\"keccak256\\":\\"0x4971631d7de74464fed3e0abac04553e917be5e8cd10b3f825e2e7c39ccc2734\\",\\"urls\\":[\\"bzzr://e1e88dfe7440ceab59d4cd604d12e5dc93409a3c5058e497763703027ea7b9e6\\"]},\\"@gnosis.pm/hg-contracts/contracts/ERC1155/IERC1155TokenReceiver.sol\\":{\\"keccak256\\":\\"0xca815b5ca57df8f1056b962c2728d6a1e56fc7d9a7869ccee8f5a1ac6075b75d\\",\\"urls\\":[\\"bzzr://61df3e61bf24c80714e326ffdc274aaefc342241de3e72374131f613cddbd042\\"]},\\"@gnosis.pm/hg-contracts/contracts/ERC1820Registry.sol\\":{\\"keccak256\\":\\"0x5a98e0985b1c43c8fe355ea4ca5d2f434ffbf24c8b77bf0c1a0b405fbd728dee\\",\\"urls\\":[\\"bzzr://15b63f9b61ed5c19993149654f5bdc1a71909973f510fa858d094a2dae9af512\\"]},\\"@gnosis.pm/hg-contracts/contracts/OracleConsumer.sol\\":{\\"keccak256\\":\\"0xf54ac4060959a5e1c1714933711c90cd62bbbf127d5e37dc6cbcbb3711b3c186\\",\\"urls\\":[\\"bzzr://2efcd8089b7f032f4cc05e4a00304eb01bad0edbc43388332c79b010df532ffc\\"]},\\"@gnosis.pm/hg-contracts/contracts/PredictionMarketSystem.sol\\":{\\"keccak256\\":\\"0x858f6788561d6f23e2ae2164813ce8f38481903752dcd2a0f625afed0ca16591\\",\\"urls\\":[\\"bzzr://194f93843b8ffc150347d678a3988809b3444a1aa239f6c11fabcd95cd19b2f3\\"]},\\"openzeppelin-solidity/contracts/introspection/ERC165.sol\\":{\\"keccak256\\":\\"0xac2eacd7e7762e275442f28f21d821544df5aae2ed7698af13be8c41b7005e2e\\",\\"urls\\":[\\"bzzr://43e901f6f210568ebc1d3591da3ce6a9d10796b854767a9c6e3da10305a8a332\\"]},\\"openzeppelin-solidity/contracts/introspection/IERC165.sol\\":{\\"keccak256\\":\\"0x661553e43d7c4fbb2de504e5999fd5c104d367488350ed5bf023031bd1ba5ac5\\",\\"urls\\":[\\"bzzr://fc2ba15143ce3a00268ecd15fc98eb2469b18bfe27a64bbab0ac6446f161c739\\"]},\\"openzeppelin-solidity/contracts/math/SafeMath.sol\\":{\\"keccak256\\":\\"0x4ccf2d7b51873db1ccfd54ca2adae5eac3b184f9699911ed4490438419f1c690\\",\\"urls\\":[\\"bzzr://1604f5b6d6e916c154efd8c6720cda069e5ba32dfa0a9dedf2b42e5b02d07f89\\"]},\\"openzeppelin-solidity/contracts/token/ERC20/IERC20.sol\\":{\\"keccak256\\":\\"0x90e8c2521653bbb1768b05889c5760031e688d9cd361f167489b89215e201b95\\",\\"urls\\":[\\"bzzr://aa8b45b57edafc3d67bc5d916327ea16807fae33f753ca163ae0c4061b789766\\"]},\\"openzeppelin-solidity/contracts/utils/Address.sol\\":{\\"keccak256\\":\\"0xf3358e5819ca73357abd6c90bdfffd0474af54364897f6b3e3234c4b71fbe9a1\\",\\"urls\\":[\\"bzzr://f7f6da60a184233fd666ac44e6fb2bd51ca6ebdc4867a310d368049aa4e62786\\"]}},\\"version\\":1}","networks":{"1":{"events":{"0xab3760c3bd2bb38b5bcf54dc79802ed67338b4cf29f3054ded67ed24661e4177":{"anonymous":false,"inputs":[{"indexed":true,"name":"conditionId","type":"bytes32"},{"indexed":true,"name":"oracle","type":"address"},{"indexed":true,"name":"questionId","type":"bytes32"},{"indexed":false,"name":"outcomeSlotCount","type":"uint256"}],"name":"ConditionPreparation","type":"event","signature":"0xab3760c3bd2bb38b5bcf54dc79802ed67338b4cf29f3054ded67ed24661e4177"},"0xb44d84d3289691f71497564b85d4233648d9dbae8cbdbb4329f301c3a0185894":{"anonymous":false,"inputs":[{"indexed":true,"name":"conditionId","type":"bytes32"},{"indexed":true,"name":"oracle","type":"address"},{"indexed":true,"name":"questionId","type":"bytes32"},{"indexed":false,"name":"outcomeSlotCount","type":"uint256"},{"indexed":false,"name":"payoutNumerators","type":"uint256[]"}],"name":"ConditionResolution","type":"event","signature":"0xb44d84d3289691f71497564b85d4233648d9dbae8cbdbb4329f301c3a0185894"},"0x2e6bb91f8cbcda0c93623c54d0403a43514fabc40084ec96b6d5379a74786298":{"anonymous":false,"inputs":[{"indexed":true,"name":"stakeholder","type":"address"},{"indexed":false,"name":"collateralToken","type":"address"},{"indexed":true,"name":"parentCollectionId","type":"bytes32"},{"indexed":true,"name":"conditionId","type":"bytes32"},{"indexed":false,"name":"partition","type":"uint256[]"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"PositionSplit","type":"event","signature":"0x2e6bb91f8cbcda0c93623c54d0403a43514fabc40084ec96b6d5379a74786298"},"0x6f13ca62553fcc2bcd2372180a43949c1e4cebba603901ede2f4e14f36b282ca":{"anonymous":false,"inputs":[{"indexed":true,"name":"stakeholder","type":"address"},{"indexed":false,"name":"collateralToken","type":"address"},{"indexed":true,"name":"parentCollectionId","type":"bytes32"},{"indexed":true,"name":"conditionId","type":"bytes32"},{"indexed":false,"name":"partition","type":"uint256[]"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"PositionsMerge","type":"event","signature":"0x6f13ca62553fcc2bcd2372180a43949c1e4cebba603901ede2f4e14f36b282ca"},"0x2682012a4a4f1973119f1c9b90745d1bd91fa2bab387344f044cb3586864d18d":{"anonymous":false,"inputs":[{"indexed":true,"name":"redeemer","type":"address"},{"indexed":true,"name":"collateralToken","type":"address"},{"indexed":true,"name":"parentCollectionId","type":"bytes32"},{"indexed":false,"name":"conditionId","type":"bytes32"},{"indexed":false,"name":"indexSets","type":"uint256[]"},{"indexed":false,"name":"payout","type":"uint256"}],"name":"PayoutRedemption","type":"event","signature":"0x2682012a4a4f1973119f1c9b90745d1bd91fa2bab387344f044cb3586864d18d"},"0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62":{"anonymous":false,"inputs":[{"indexed":true,"name":"operator","type":"address"},{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"id","type":"uint256"},{"indexed":false,"name":"value","type":"uint256"}],"name":"TransferSingle","type":"event","signature":"0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62"},"0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb":{"anonymous":false,"inputs":[{"indexed":true,"name":"operator","type":"address"},{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"ids","type":"uint256[]"},{"indexed":false,"name":"values","type":"uint256[]"}],"name":"TransferBatch","type":"event","signature":"0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb"},"0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31":{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"operator","type":"address"},{"indexed":false,"name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event","signature":"0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31"},"0x6bb7ff708619ba0610cba295a58592e0451dee2622938c8755667688daf3529b":{"anonymous":false,"inputs":[{"indexed":false,"name":"value","type":"string"},{"indexed":true,"name":"id","type":"uint256"}],"name":"URI","type":"event","signature":"0x6bb7ff708619ba0610cba295a58592e0451dee2622938c8755667688daf3529b"}},"links":{},"address":"0x5b306B1D0f1C1959777469a3fd42557298E9193A","transactionHash":"0x22994dc7ab5d2b3ccc8b8cae44f9271451633bf94456df74b9364ae70e00eb8c"},"4":{"events":{"0xab3760c3bd2bb38b5bcf54dc79802ed67338b4cf29f3054ded67ed24661e4177":{"anonymous":false,"inputs":[{"indexed":true,"name":"conditionId","type":"bytes32"},{"indexed":true,"name":"oracle","type":"address"},{"indexed":true,"name":"questionId","type":"bytes32"},{"indexed":false,"name":"outcomeSlotCount","type":"uint256"}],"name":"ConditionPreparation","type":"event","signature":"0xab3760c3bd2bb38b5bcf54dc79802ed67338b4cf29f3054ded67ed24661e4177"},"0xb44d84d3289691f71497564b85d4233648d9dbae8cbdbb4329f301c3a0185894":{"anonymous":false,"inputs":[{"indexed":true,"name":"conditionId","type":"bytes32"},{"indexed":true,"name":"oracle","type":"address"},{"indexed":true,"name":"questionId","type":"bytes32"},{"indexed":false,"name":"outcomeSlotCount","type":"uint256"},{"indexed":false,"name":"payoutNumerators","type":"uint256[]"}],"name":"ConditionResolution","type":"event","signature":"0xb44d84d3289691f71497564b85d4233648d9dbae8cbdbb4329f301c3a0185894"},"0x2e6bb91f8cbcda0c93623c54d0403a43514fabc40084ec96b6d5379a74786298":{"anonymous":false,"inputs":[{"indexed":true,"name":"stakeholder","type":"address"},{"indexed":false,"name":"collateralToken","type":"address"},{"indexed":true,"name":"parentCollectionId","type":"bytes32"},{"indexed":true,"name":"conditionId","type":"bytes32"},{"indexed":false,"name":"partition","type":"uint256[]"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"PositionSplit","type":"event","signature":"0x2e6bb91f8cbcda0c93623c54d0403a43514fabc40084ec96b6d5379a74786298"},"0x6f13ca62553fcc2bcd2372180a43949c1e4cebba603901ede2f4e14f36b282ca":{"anonymous":false,"inputs":[{"indexed":true,"name":"stakeholder","type":"address"},{"indexed":false,"name":"collateralToken","type":"address"},{"indexed":true,"name":"parentCollectionId","type":"bytes32"},{"indexed":true,"name":"conditionId","type":"bytes32"},{"indexed":false,"name":"partition","type":"uint256[]"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"PositionsMerge","type":"event","signature":"0x6f13ca62553fcc2bcd2372180a43949c1e4cebba603901ede2f4e14f36b282ca"},"0x2682012a4a4f1973119f1c9b90745d1bd91fa2bab387344f044cb3586864d18d":{"anonymous":false,"inputs":[{"indexed":true,"name":"redeemer","type":"address"},{"indexed":true,"name":"collateralToken","type":"address"},{"indexed":true,"name":"parentCollectionId","type":"bytes32"},{"indexed":false,"name":"conditionId","type":"bytes32"},{"indexed":false,"name":"indexSets","type":"uint256[]"},{"indexed":false,"name":"payout","type":"uint256"}],"name":"PayoutRedemption","type":"event","signature":"0x2682012a4a4f1973119f1c9b90745d1bd91fa2bab387344f044cb3586864d18d"},"0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62":{"anonymous":false,"inputs":[{"indexed":true,"name":"_operator","type":"address"},{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_id","type":"uint256"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"TransferSingle","type":"event","signature":"0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62"},"0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb":{"anonymous":false,"inputs":[{"indexed":true,"name":"_operator","type":"address"},{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_ids","type":"uint256[]"},{"indexed":false,"name":"_values","type":"uint256[]"}],"name":"TransferBatch","type":"event","signature":"0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb"},"0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31":{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_operator","type":"address"},{"indexed":false,"name":"_approved","type":"bool"}],"name":"ApprovalForAll","type":"event","signature":"0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31"},"0x6bb7ff708619ba0610cba295a58592e0451dee2622938c8755667688daf3529b":{"anonymous":false,"inputs":[{"indexed":false,"name":"_value","type":"string"},{"indexed":true,"name":"_id","type":"uint256"}],"name":"URI","type":"event","signature":"0x6bb7ff708619ba0610cba295a58592e0451dee2622938c8755667688daf3529b"}},"links":{},"address":"0xeCfc7AC377d3cb74FE1553ECd56757Fbd8185505","transactionHash":"0xd5b0010b238e0a7355c68a83ff331e6b12a2c9a3658e00f2c45a011f3fb1eef8"},"1560796448006":{"events":{"0xab3760c3bd2bb38b5bcf54dc79802ed67338b4cf29f3054ded67ed24661e4177":{"anonymous":false,"inputs":[{"indexed":true,"name":"conditionId","type":"bytes32"},{"indexed":true,"name":"oracle","type":"address"},{"indexed":true,"name":"questionId","type":"bytes32"},{"indexed":false,"name":"outcomeSlotCount","type":"uint256"}],"name":"ConditionPreparation","type":"event","signature":"0xab3760c3bd2bb38b5bcf54dc79802ed67338b4cf29f3054ded67ed24661e4177"},"0xb44d84d3289691f71497564b85d4233648d9dbae8cbdbb4329f301c3a0185894":{"anonymous":false,"inputs":[{"indexed":true,"name":"conditionId","type":"bytes32"},{"indexed":true,"name":"oracle","type":"address"},{"indexed":true,"name":"questionId","type":"bytes32"},{"indexed":false,"name":"outcomeSlotCount","type":"uint256"},{"indexed":false,"name":"payoutNumerators","type":"uint256[]"}],"name":"ConditionResolution","type":"event","signature":"0xb44d84d3289691f71497564b85d4233648d9dbae8cbdbb4329f301c3a0185894"},"0x2e6bb91f8cbcda0c93623c54d0403a43514fabc40084ec96b6d5379a74786298":{"anonymous":false,"inputs":[{"indexed":true,"name":"stakeholder","type":"address"},{"indexed":false,"name":"collateralToken","type":"address"},{"indexed":true,"name":"parentCollectionId","type":"bytes32"},{"indexed":true,"name":"conditionId","type":"bytes32"},{"indexed":false,"name":"partition","type":"uint256[]"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"PositionSplit","type":"event","signature":"0x2e6bb91f8cbcda0c93623c54d0403a43514fabc40084ec96b6d5379a74786298"},"0x6f13ca62553fcc2bcd2372180a43949c1e4cebba603901ede2f4e14f36b282ca":{"anonymous":false,"inputs":[{"indexed":true,"name":"stakeholder","type":"address"},{"indexed":false,"name":"collateralToken","type":"address"},{"indexed":true,"name":"parentCollectionId","type":"bytes32"},{"indexed":true,"name":"conditionId","type":"bytes32"},{"indexed":false,"name":"partition","type":"uint256[]"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"PositionsMerge","type":"event","signature":"0x6f13ca62553fcc2bcd2372180a43949c1e4cebba603901ede2f4e14f36b282ca"},"0x2682012a4a4f1973119f1c9b90745d1bd91fa2bab387344f044cb3586864d18d":{"anonymous":false,"inputs":[{"indexed":true,"name":"redeemer","type":"address"},{"indexed":true,"name":"collateralToken","type":"address"},{"indexed":true,"name":"parentCollectionId","type":"bytes32"},{"indexed":false,"name":"conditionId","type":"bytes32"},{"indexed":false,"name":"indexSets","type":"uint256[]"},{"indexed":false,"name":"payout","type":"uint256"}],"name":"PayoutRedemption","type":"event","signature":"0x2682012a4a4f1973119f1c9b90745d1bd91fa2bab387344f044cb3586864d18d"},"0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62":{"anonymous":false,"inputs":[{"indexed":true,"name":"operator","type":"address"},{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"id","type":"uint256"},{"indexed":false,"name":"value","type":"uint256"}],"name":"TransferSingle","type":"event","signature":"0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62"},"0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb":{"anonymous":false,"inputs":[{"indexed":true,"name":"operator","type":"address"},{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"ids","type":"uint256[]"},{"indexed":false,"name":"values","type":"uint256[]"}],"name":"TransferBatch","type":"event","signature":"0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb"},"0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31":{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"operator","type":"address"},{"indexed":false,"name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event","signature":"0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31"},"0x6bb7ff708619ba0610cba295a58592e0451dee2622938c8755667688daf3529b":{"anonymous":false,"inputs":[{"indexed":false,"name":"value","type":"string"},{"indexed":true,"name":"id","type":"uint256"}],"name":"URI","type":"event","signature":"0x6bb7ff708619ba0610cba295a58592e0451dee2622938c8755667688daf3529b"}},"links":{},"address":"0x13f1CF1f43f8BA39033E604fCF5062528614A4Dc","transactionHash":"0xb84b4caf5c92c018cce732e9c1617b803497a4aedab677a1ab25d2a0a6b1a275"}}};//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiIxMy5qcyIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///13\n')}}]);