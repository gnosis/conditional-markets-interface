module.exports = {
  parser: "babel-eslint",
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:prettier/recommended"
  ],
  env: {
    node: true,
    es6: true,
    browser: true,
    jest: true
  },
  plugins: ["react-hooks"],
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
