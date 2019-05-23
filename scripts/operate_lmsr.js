const ERC20Detailed = artifacts.require("ERC20Detailed");
const IDSToken = artifacts.require("IDSToken");
const WETH9 = artifacts.require("WETH9");
const PredictionMarketSystem = artifacts.require("PredictionMarketSystem");
const LMSRMarketMaker = artifacts.require("LMSRMarketMaker");

const fs = require("fs");
const path = require("path");
const inquirer = require("inquirer");
const { stripIndent } = require("common-tags");
const Decimal = require("decimal.js-light");

function* product(head = [], ...tail) {
  for (const h of head) {
    const remainder = tail.length > 0 ? product(...tail) : [[]];
    for (const r of remainder) yield [h, ...r];
  }
}

module.exports = function(callback) {
  (async function() {
    const config = JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", "app", "config.json"))
    );
    const currentNetworkId = await web3.eth.net.getId();

    if (currentNetworkId !== config.networkId)
      throw new Error(
        `expected configured network ID ${
          config.networkId
        } but connected to network ID ${currentNetworkId}`
      );

    const lmsrMarketMaker = await LMSRMarketMaker.at(config.lmsrAddress);
    const pmSystem = await PredictionMarketSystem.deployed();

    const owner = await lmsrMarketMaker.owner();
    const defaultAccount = LMSRMarketMaker.defaults().from;

    const collateral = await require("../app/src/utils/collateral-info")(
      web3,
      Decimal,
      { ERC20Detailed, IDSToken, WETH9 },
      lmsrMarketMaker
    );

    const formatCollateralAmount = amount =>
      `${
        collateral.decimals === 18
          ? web3.utils.fromWei(amount)
          : Number(amount.toString()) * 10 ** -collateral.decimals
      } ${collateral.symbol}`;

    let cliRunning = true;
    while (cliRunning) {
      let funding = await lmsrMarketMaker.funding();
      let stage = ["Running", "Paused", "Closed"][
        (await lmsrMarketMaker.stage()).toNumber()
      ];
      let feePercentage = web3.utils.fromWei(
        (await lmsrMarketMaker.fee()).imuln(100)
      );

      let feesCollected = await collateral.contract.balanceOf(
        lmsrMarketMaker.address
      );
      let userCollateralBalance = await collateral.contract.balanceOf(
        defaultAccount
      );

      const atomicOutcomeSlotCount = (await lmsrMarketMaker.atomicOutcomeSlotCount()).toNumber();
      const conditions = [];

      let curAtomicOutcomeSlotCount = 1;
      while (curAtomicOutcomeSlotCount < atomicOutcomeSlotCount) {
        const id = await lmsrMarketMaker.conditionIds(conditions.length);
        const numSlots = (await pmSystem.getOutcomeSlotCount(id)).toNumber();
        const collectionIds = Array.from({ length: numSlots }, (_, i) =>
          web3.utils.soliditySha3(
            { t: "bytes32", v: id },
            { t: "uint", v: 1 << i }
          )
        );
        conditions.push({ id, numSlots, collectionIds });
        curAtomicOutcomeSlotCount *= numSlots;
      }

      const positionIds = [];
      for (const collectionIdTuple of product(
        ...conditions.map(({ collectionIds }) => collectionIds)
      )) {
        positionIds.push(
          web3.utils.soliditySha3(
            { t: "address", v: collateral.address },
            {
              t: "uint",
              v: collectionIdTuple
                .map(id => web3.utils.toBN(id))
                .reduce((a, b) => a.add(b))
                .maskn(256)
            }
          )
        );
      }

      console.log("_".repeat(process.stdout.columns));
      console.log("");
      console.log(stripIndent`
        LMSR @ ${lmsrMarketMaker.address}
          Owner: ${owner}
          Collateral: ${collateral.name} @ ${collateral.address}
          Funding: ${formatCollateralAmount(funding)}
          Fee: ${feePercentage}%
          Stage: ${stage}
          Fees collected: ${formatCollateralAmount(feesCollected)}
      `);
      console.log("");
      console.log("LMSR balances:");
      console.log(
        await Promise.all(
          positionIds.map(id =>
            pmSystem
              .balanceOf(lmsrMarketMaker.address, id)
              .then(formatCollateralAmount)
          )
        )
      );
      console.log("");
      console.log(stripIndent`
        User balances:
          Collateral: ${formatCollateralAmount(userCollateralBalance)}
          PM System:
      `);
      console.log(
        (await Promise.all(
          positionIds.map(id => pmSystem.balanceOf(defaultAccount, id))
        )).map(formatCollateralAmount)
      );
      console.log("");

      const actions = [{ name: "Refresh", async value() {} }];

      if (stage === "Running") {
        actions.push({
          name: "Pause market",
          async value() {
            await lmsrMarketMaker.pause({ from: owner });
          }
        });
      }
      if (stage === "Paused") {
        actions.push(
          {
            name: "Resume market",
            async value() {
              await lmsrMarketMaker.resume({ from: owner });
            }
          },
          {
            name: "Change funding level",
            async value() {
              const { fundingChangeStr } = await inquirer.prompt([
                {
                  type: "string",
                  name: "fundingChangeStr",
                  message: `How much ${
                    collateral.symbol
                  } would you like to change the funding by?`
                }
              ]);

              let fundingChange;

              if (collateral.decimals === 18) {
                fundingChange = web3.utils.toBN(
                  web3.utils.toWei(fundingChangeStr)
                );
              } else {
                fundingChange = web3.utils
                  .toBN(10)
                  .pown(collateral.decimals)
                  .muln(parseFloat(fundingChangeStr));
              }

              if (fundingChange.gtn(0)) {
                const currentBalance = await collateral.contract.balanceOf(
                  owner
                );
                if (collateral.isWETH && currentBalance.lt(fundingChange))
                  await collateral.contract.deposit({
                    value: fundingChange.sub(currentBalance),
                    from: owner
                  });

                const currentAllowance = await collateral.contract.allowance(
                  owner,
                  lmsrMarketMaker.address
                );
                if (currentAllowance.lt(fundingChange))
                  await collateral.contract.approve(
                    lmsrMarketMaker.address,
                    fundingChange,
                    { from: owner }
                  );
              }

              await lmsrMarketMaker.changeFunding(fundingChange, {
                from: owner
              });
            }
          },
          {
            name: "Change fee amount",
            async value() {
              const { newFeePercentage } = await inquirer.prompt([
                {
                  type: "string",
                  name: "newFeePercentage",
                  message: "What percent of fees would you like to set?"
                }
              ]);
              await lmsrMarketMaker.changeFee(
                web3.utils.toBN(web3.utils.toWei(newFeePercentage)).divn(100),
                { from: owner }
              );
            }
          }
        );
      }
      if (stage !== "Closed") {
        actions.push({
          name: "Close market",
          async value() {
            await lmsrMarketMaker.close({ from: owner });
          }
        });
      }

      if (feesCollected.gtn(0)) {
        actions.push({
          name: "Withdraw fees",
          async value() {
            await lmsrMarketMaker.withdrawFees({ from: owner });
          }
        });
      }

      actions.push({
        name: "Quit",
        async value() {
          cliRunning = false;
        }
      });

      await (await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "What would you like to do?",
          choices: actions
        }
      ])).action();
    }
  })().then(() => callback(), callback);
};
