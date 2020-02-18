const Decimal = require("decimal.js-light");

const getTokenInfo = async contract => {
  const [name, symbol, decimals] = await Promise.all([
    contract.name(),
    contract.symbol(),
    contract.decimals()
  ]);

  return {
    name,
    symbol,
    decimals: decimals.toNumber()
  };
};

module.exports = async function getCollateralInfo(
  web3,
  { ERC20Detailed, IDSToken, WETH9 },
  collateralTokenAddress
) {
  const { hexToUtf8 } = web3.utils;
  let collateral = {};
  collateral.address = collateralTokenAddress;
  const [
    ERC20DetailedContract,
    IDSTokenContract,
    WETH9Contract
  ] = await Promise.all([
    ERC20Detailed.at(collateral.address),
    IDSToken.at(collateral.address),
    WETH9.at(collateral.address)
  ]);

  let tokenInfo;
  try {
    collateral.contract = ERC20DetailedContract;
    tokenInfo = await getTokenInfo(collateral.contract);
    collateral = { ...collateral, ...tokenInfo };
  } catch (e) {
    collateral.contract = IDSTokenContract;
    tokenInfo = await getTokenInfo(collateral.contract);
    collateral.name = hexToUtf8(tokenInfo.name);
    collateral.symbol = hexToUtf8(tokenInfo.symbol);
    collateral.decimals = tokenInfo.decimals;
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
    collateral.symbol = "ETH";
    collateral.name = "Wrapped Ether";
    collateral.contract = WETH9Contract;
  } else if (collateral.isDAI) {
    collateral.symbol = "DAI";
    collateral.name = "DAI";
  }

  return collateral;
};
