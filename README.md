# prediction-market
The original fully FCLA decentralized prediction markets.

## Development Instructions

1. Run `yarn install`
2. In a separate terminal, run `ganache-cli -d`
3. Run `npm run migrate`
4. Start the dev server with `npm start`

It will generate a build folder inside the root with the styles, JS assets and contracts.

## Debug Instructions

Run `npm run build-css` generate CSS assets separately.
Run `npm run build-js` to generate JS assets separately.

### Running Helper Scripts

For operating the LMSR market maker

    npx truffle exec scripts/operate_lmsr.js

For resolving the decentralized oracles

    npx truffle exec scripts/resolve_decentralized_oracles.js

## Troubleshooting

### Empty Websocket Dependency Directory Build Errors

If, after installing a new module, you see an error of the following form:

```
npm ERR! path /root_path/flyingcarpet/prediction-market/node_modules/web3-providers-ws/node_modules/websocket
npm ERR! code EISGIT
npm ERR! git /root_path/flyingcarpet/prediction-market/node_modules/web3-providers-ws/node_modules/websocket: Appears to be a git repo or submodule.
npm ERR! git     /root_path/flyingcarpet/prediction-market/node_modules/web3-providers-ws/node_modules/websocket
npm ERR! git Refusing to remove it. Update manually,
npm ERR! git or move it out of the way first.
```

It means that one (or multiple) of the `websocket` module dependencies has been corrupted. Run the following to delete all websocket module dependencies (including sub-dependencies):

```
find . -name websocket -exec rm -rf {} \;
```

Next, proceed with the installation of your module (e.g.: `npm install additional-module --save`). Afterwards, run the above (deletion) command again. Finally, you'll need to run:

```
npm i
```

Now the module dependency structure should be fixed with the new module installed.
