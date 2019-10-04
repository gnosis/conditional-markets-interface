const ConditionalTokensService = require("./ConditionalTokensService");
const conf = require("../../conf");
import getConditionalTokensRepo from "../../repositories/ConditionalTokensRepo";

let instance, instancePromise;

async function _getInstance() {
  const [conditionalTokensRepo] = await Promise.all([
    getConditionalTokensRepo()
  ]);

  return new ConditionalTokensService({
    conditionalTokensRepo,
    markets: conf.MARKETS
  });
}

export default async () => {
  if (!instance) {
    if (!instancePromise) {
      instancePromise = _getInstance();
    }

    instance = await instancePromise;
  }

  return instance;
};
