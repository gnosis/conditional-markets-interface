module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:prettier/recommended"
  ],
  parser: "babel-eslint",
  settings: {
    react: {
      version: "detect"
    }
  },
  env: {
    node: true,
    es6: true
  }
};
