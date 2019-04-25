import web3 from "web3";

const { isBN, toBN, BN, leftPad } = web3.utils;

export const normHex = i => (`${i}`.startsWith("0x") ? i.slice(2) : i);

export const asAddress = adr => {
  toBN(adr); // try to use as BN for sanity check
  return `0x${leftPad(normHex(adr.toString()), 40)}`;
};

export const asBytes32 = num => {
  toBN(num); // try to use as BN for sanity check
  return `${leftPad(normHex(num).toString(16), 64)}`;
};

export const addWithOverflow = (a, b) => {
  const aBN = isBN(a) ? a : toBN(a);
  const bBN = isBN(b) ? b : toBN(b);

  const aBinary = aBN.toString(2).slice(-256);
  const bBinary = bBN.toString(2).slice(-256);

  const product = new BN(aBinary, 2).add(new BN(bBinary, 2));

  const productTrunctated = new BN(product.toString(2), 2)
    .toString(2)
    .slice(-256);

  return new BN(productTrunctated, 2);
};
