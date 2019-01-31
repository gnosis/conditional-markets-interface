module.exports = {
  extends: [
    "plugin:react/recommended",
    "eslint:recommended",
    "plugin:prettier/recommended",
    "prettier"
  ],
  parserOptions: { ecmaVersion: 8, sourceType: "module" },
  env: {
    es6: true,
    node: true,
    mocha: true
  },
  root: true,
  globals: {
    assert: true,
    contract: true,
    artifacts: true,
    web3: true
  },
  ecmaFeatures: {
    experimentalObjectRestSpread: true,
    jsx: true
  },
  rules: {
    "no-redeclare": 0
  },
  plugins: ["react"]
};
