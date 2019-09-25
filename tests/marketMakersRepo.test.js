// import Web3 from "web3";
// const { BN } = Web3.utils;

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
