const Decimal = require("decimal.js-light");

module.exports = async function getCollateralInfo(
  web3,
  { ERC20Detailed, IDSToken, WETH9 },
  lmsrMarketMaker
) {
  const { hexToUtf8 } = web3.utils;
  const collateral = {};
  collateral.address = await lmsrMarketMaker.collateralToken();
  collateral.contract = await ERC20Detailed.at(collateral.address);

  try {
    collateral.name = await collateral.contract.name();
    collateral.symbol = await collateral.contract.symbol();
    collateral.decimals = (await collateral.contract.decimals()).toNumber();
  } catch (e) {
    collateral.contract = await IDSToken.at(collateral.address);
    collateral.name = hexToUtf8(await collateral.contract.name());
    collateral.symbol = hexToUtf8(await collateral.contract.symbol());
    collateral.decimals = (await collateral.contract.decimals()).toNumber();
  }

  collateral.toUnitsMultiplier = new Decimal(10).pow(collateral.decimals);
  collateral.fromUnitsMultiplier = new Decimal(10).pow(-collateral.decimals);

  collateral.isWETH =
    collateral.name === "Wrapped Ether" &&
    collateral.symbol === "WETH" &&
    collateral.decimals === 18;

  collateral.isDAI =
    collateral.name === "Dai Stablecoin v1.0" &&
    collateral.symbol === "DAI" &&
    collateral.decimals === 18;

  if (collateral.isWETH) {
    collateral.symbol = "\u039E";
    collateral.contract = await WETH9.at(collateral.address);
  } else if (collateral.isDAI) {
    collateral.symbol = "\u25C8";
  }

  return collateral;
};
