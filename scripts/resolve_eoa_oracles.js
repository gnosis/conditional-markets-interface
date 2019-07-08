const LMSRMarketMaker = artifacts.require("LMSRMarketMaker");
const PredictionMarketSystem = artifacts.require("PredictionMarketSystem");

const fs = require("fs");
const path = require("path");
const inquirer = require("inquirer");
const indentString = require("indent-string");
const { stripIndent } = require("common-tags");

const { oracle } = require("../migrations/utils/deploy-config")(artifacts);
const markets = require("../markets.config");

module.exports = function(callback) {
  (async function() {
    const appConfig = JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", "app", "config.json"))
    );
    const currentNetworkId = await web3.eth.net.getId();

    if (currentNetworkId !== appConfig.networkId)
      throw new Error(
        `expected configured network ID ${
          appConfig.networkId
        } but connected to network ID ${currentNetworkId}`
      );

    const lmsrMarketMaker = await LMSRMarketMaker.at(appConfig.lmsrAddress);
    const pmSystem = await PredictionMarketSystem.at(
      await lmsrMarketMaker.pmSystem()
    );

    for (let i = 0; i < markets.length; i++) {
      const market = markets[i];
      const conditionId = web3.utils.soliditySha3(
        { t: "address", v: oracle },
        { t: "bytes32", v: market.questionId },
        { t: "uint", v: market.outcomes.length }
      );

      const actualConditionId = await lmsrMarketMaker.conditionIds(i);
      if (conditionId !== actualConditionId) {
        throw new Error(
          `expected to get condition ID ${conditionId} but got ${actualConditionId}`
        );
      }

      market.conditionId = conditionId;

      const payoutDenominator = await pmSystem.payoutDenominator(conditionId);
      market.isResolved = !payoutDenominator.eqn(0);
      if (market.isResolved) {
        market.payoutDenominator = payoutDenominator;

        for (let j = 0; j < market.outcomes.length; j++) {
          const outcome = market.outcomes[j];
          outcome.payoutNumerator = await pmSystem.payoutNumerators(
            conditionId,
            j
          );
          if (outcome.payoutNumerator.eq(market.payoutDenominator)) {
            market.resolvedOutcomeIndex = j;
          }
        }
      }
    }

    const resolvedMarkets = markets.filter(({ isResolved }) => isResolved);
    console.log("Resolved markets:\n");
    if (resolvedMarkets.length > 0)
      resolvedMarkets.forEach(resolvedMarket => {
        const { title, resolvedOutcomeIndex, outcomes } = resolvedMarket;
        console.log(
          indentString(
            stripIndent`
              ${title}
                → ${
                  resolvedOutcomeIndex == null
                    ? "Mixed"
                    : outcomes[resolvedOutcomeIndex].title
                }
            `,
            2
          )
        );
        console.log();
      });
    else console.log("  No resolved markets yet\n");

    const unresolvedMarkets = markets.filter(({ isResolved }) => !isResolved);
    const { marketToResolve } = await inquirer.prompt([
      {
        type: "list",
        name: "marketToResolve",
        message: "Which market would you like to resolve?",
        choices: [
          ...unresolvedMarkets.map(market => ({
            name: market.title,
            value: market
          })),
          {
            name: "(None)",
            value: null
          }
        ]
      }
    ]);

    if (marketToResolve == null) return;

    const { resolutionOutcome } = await inquirer.prompt([
      {
        type: "list",
        name: "resolutionOutcome",
        message: "Which outcome should this market resolve to?",
        choices: [
          ...marketToResolve.outcomes.map((outcome, index) => ({
            name: outcome.title,
            value: { ...outcome, index }
          })),
          {
            name: "(Cancel)",
            value: null
          }
        ]
      }
    ]);

    if (resolutionOutcome == null) return;

    const resultPayload = web3.eth.abi.encodeParameters(
      new Array(marketToResolve.outcomes.length).fill("uint256"),
      Array.from({ length: marketToResolve.outcomes.length }, (_, i) =>
        i === resolutionOutcome.index ? 1 : 0
      )
    );

    await pmSystem.receiveResult(marketToResolve.questionId, resultPayload, {
      from: oracle
    });
  })().then(() => callback(), callback);
};
