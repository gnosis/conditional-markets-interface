import Web3 from "web3";
const { toBN } = Web3.utils;

import getMarketMakersRepo from "../app/src/repositories/MarketMakersRepo";

test("It should return expected conditionIds", async () => {
  const marketMakersRepo = await getMarketMakersRepo();

  const atomicOutcomeSlotCount = await marketMakersRepo.atomicOutcomeSlotCount();
  let conditionIdsPromises = [];
  for (let i = 0; i < 2; i++) {
    conditionIdsPromises[i] = marketMakersRepo.conditionIds(i);
  }
  const result = await Promise.all(conditionIdsPromises);
  console.log(result.toString());
});

test("It should return expected atomicOutcomeSlotCount", async () => {
  const marketMakersRepo = await getMarketMakersRepo();

  const result = await marketMakersRepo.atomicOutcomeSlotCount();
  console.log(result.toString());
});

test("It should return expected owner", async () => {
  const marketMakersRepo = await getMarketMakersRepo();

  const result = await marketMakersRepo.owner();
  console.log(result.toString());
});

test("It should return expected fee", async () => {
  const marketMakersRepo = await getMarketMakersRepo();

  const result = await marketMakersRepo.fee();
  console.log(result.toString());
});

test("It should return expected funding", async () => {
  const marketMakersRepo = await getMarketMakersRepo();

  const result = await marketMakersRepo.funding();
  console.log(result.toString());
});

test("It should return expected stage", async () => {
  const marketMakersRepo = await getMarketMakersRepo();

  const result = await marketMakersRepo.stage();
  console.log(result.toString());
});

test("It should return expected calcNetCost", async () => {
  const marketMakersRepo = await getMarketMakersRepo();

  const result = await marketMakersRepo.calcNetCost([
    "-1",
    "0",
    "-1",
    "0",
    "-1",
    "0",
    "-1",
    "0"
  ]);
  console.log(result.toString());
});

test.only("It should return expected calcNetCost", async () => {
  const marketMakersRepo = await getMarketMakersRepo();
  const collateralToken = await marketMakersRepo.getCollateralToken();
  const marketMakersAddress = await marketMakersRepo.getAddress();
  // console.log(collateralToken)
  // console.log(collateralToken.address)
  await collateralToken.contract.deposit({ value: toBN('1000000000000000000'), from: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1' });
  await collateralToken.contract.approve(
    marketMakersAddress,
    toBN("1000000000000000000"),
    { from: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1" }
  );
  const allowance = await collateralToken.contract.allowance("0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1", marketMakersAddress)
  console.log("marketMaker allowance", allowance.toString());
  const result = await marketMakersRepo.trade([toBN('9999999999999999'), toBN('0')], toBN('5849625007211562'), '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1');
  console.log(result.toString());
});
