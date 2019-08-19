module.exports = {
  env: {
    browser: true,
    jest: true
  },
  settings: {
    "import/resolver": {
      node: {
        paths: ["src"]
      }
    }
  }
};
