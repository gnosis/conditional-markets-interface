module.exports = {
  parser: "babel-eslint",
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:prettier/recommended"
  ],
  env: {
    node: true,
    es6: true,
    browser: true,
    jest: true
  },
  settings: {
    react: {
      version: "detect"
    },
    "import/resolver": {
      node: {
        paths: ["app", "src"]
      }
    }
  }
};
