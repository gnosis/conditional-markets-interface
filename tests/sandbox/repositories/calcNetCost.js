const getMarketMakersRepo = require("../../../app/src/repositories/MarketMakersRepo");

async function launch() {
  const marketMakersRepo = await getMarketMakersRepo();

  marketMakersRepo.calcNetCost(["-1", "0", "-1", "0"]);
}

launch().then(result => {
  console.log(result);
});
