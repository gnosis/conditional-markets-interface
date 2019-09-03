# Conditional Markets Interface
Frontend Interface to display and operate conditional markets, based on Gnosis' [Conditional Token Standard](https://github.com/gnosis/conditional-tokens-contracts).

## Development Instructions

1. Run `npm install`
2. In a separate terminal, run `ganache-cli -d -i 437894314313`
3. Run `npm run migrate`. If the migration finishes successfully, `app/src/config.json` will be updated accordingly.
4. Start the webpack dev server with `npm start`. This makes a hot-reloading dev build of the interface.

## Testnet Development Instructions

1. Create a `.env` file in the root of this project with the following contents:

   ```
   # Use your own mnemonic phrase here:
   SEED='myth like bonus scare over problem client lizard pioneer submit female collect'
   AMMFUNDING=1000000000000000000
   ```

   The 0th account associated with the `SEED` will deploy the contracts, be the oracle for the conditions, and also be the operator of the `LMSRMarketMaker`. It needs to have enough ether for gas costs, as well as the amount specified as `AMMFUNDING`, which will be used as funding for the `LMSRMarketMaker`. `AMMFUNDING` defaults to 1000000000000000000, which is one ether in wei.

2. Run `npm run migrate -- --network ropsten`. Available networks are `ropsten`, `rinkeby`, `kovan`, and `goerli`. `app/src/config.json` will be updated accordingly. If the migration finishes successfully, `app/src/config.json` will be updated accordingly.

3. Start the webpack dev server with `npm start`. This makes a hot-reloading dev build of the interface.

4. Make a build with `npm run build`. This will output a webpack production build in `docs`, which may be used in conjunction with a static hosting service such as Github Pages or S3.

### Running Helper Scripts

For operating the LMSR market maker

    npx truffle exec scripts/operate_lmsr.js

For resolving the decentralized oracles

    npx truffle exec scripts/resolve_decentralized_oracles.js
