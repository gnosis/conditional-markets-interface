const ERC20Detailed = artifacts.require("ERC20Detailed");
const WETH9 = artifacts.require("WETH9");
const LMSRMarketMaker = artifacts.require("LMSRMarketMaker");

const fs = require("fs");
const path = require("path");
const inquirer = require("inquirer");
const { stripIndent } = require("common-tags");

module.exports = function(callback) {
  (async function() {
    const fullConfig = JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", "app", "config.json"))
    );
    const currentNetworkId = await web3.eth.net.getId();
    const [networkName, networkConfig] = Object.entries(fullConfig).find(
      ([, { networkId }]) => networkId === currentNetworkId
    );

    if (networkName == null || networkConfig == null)
      throw new Error(
        `could not find config with network ID ${currentNetworkId}`
      );

    const lmsrMarketMaker = await LMSRMarketMaker.at(networkConfig.lmsr);

    const owner = await lmsrMarketMaker.owner();
    const defaultAccount = LMSRMarketMaker.defaults().from;

    const collateral = {};
    collateral.address = await lmsrMarketMaker.collateralToken();
    collateral.contract = await ERC20Detailed.at(collateral.address);
    collateral.name = await collateral.contract.name();
    collateral.symbol = await collateral.contract.symbol();
    collateral.decimals = (await collateral.contract.decimals()).toNumber();
    collateral.isWETH =
      collateral.name === "Wrapped Ether" &&
      collateral.symbol === "WETH" &&
      collateral.decimals === 18;
    if (collateral.isWETH) {
      collateral.contract = await WETH9.at(collateral.address);
    }

    const feeRange = await lmsrMarketMaker.FEE_RANGE();

    const formatCollateralAmount = amount =>
      `${Number(amount.toString()) * 10 ** -collateral.decimals} ${
        collateral.symbol
      }`;

    console.log(`Using config ${networkName} (id ${currentNetworkId})`);

    let cliRunning = true;
    while (cliRunning) {
      let funding = await lmsrMarketMaker.funding();
      let stage = ["Running", "Paused", "Closed"][
        (await lmsrMarketMaker.stage()).toNumber()
      ];
      let fee =
        Number((await lmsrMarketMaker.fee()).toString()) /
        Number(feeRange.toString());
      let feesCollected = await collateral.contract.balanceOf(
        lmsrMarketMaker.address
      );

      console.log("_".repeat(process.stdout.columns));
      console.log("");
      console.log(stripIndent`
              LMSR @ ${lmsrMarketMaker.address}
                Owner: ${owner}
                Collateral: ${collateral.name} @ ${collateral.address}
                Funding: ${formatCollateralAmount(funding)}
                Fee: ${fee * 100}%
                Stage: ${stage}
                Fees collected: ${formatCollateralAmount(feesCollected)}
          `);
      console.log("");

      const actions = [{ name: "Refresh", async value() {} }];

      if (defaultAccount === owner) {
        if (stage === "Running") {
          actions.push({
            name: "Pause market",
            value: lmsrMarketMaker.pause
          });
        }
        if (stage === "Paused") {
          actions.push(
            {
              name: "Resume market",
              value: lmsrMarketMaker.resume
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
                    defaultAccount
                  );
                  if (collateral.isWETH && currentBalance.lt(fundingChange))
                    await collateral.contract.deposit({
                      value: fundingChange.sub(currentBalance)
                    });

                  const currentAllowance = await collateral.contract.allowance(
                    defaultAccount,
                    lmsrMarketMaker.address
                  );
                  if (currentAllowance.lt(fundingChange))
                    await collateral.contract.approve(
                      lmsrMarketMaker.address,
                      fundingChange
                    );
                }

                await lmsrMarketMaker.changeFunding(fundingChange);
              }
            },
            {
              name: "Change fee amount",
              async value() {
                const { feePercentage } = await inquirer.prompt([
                  {
                    type: "number",
                    name: "feePercentage",
                    message: "What percent of fees would you like to set?"
                  }
                ]);
                await lmsrMarketMaker.changeFee(
                  feeRange.muln(feePercentage).divn(100)
                );
              }
            }
          );
        }
        if (stage !== "Closed") {
          actions.push({
            name: "Close market",
            value: lmsrMarketMaker.close
          });
        }

        if (feesCollected.gtn(0)) {
          actions.push({
            name: "Withdraw fees",
            value: lmsrMarketMaker.withdrawFees
          });
        }
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