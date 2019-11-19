module.exports = {
  "presets": ["@babel/preset-react"],
  "plugins": [
    "@babel/plugin-syntax-dynamic-import",
    "react-hot-loader/babel"
  ],
  "env": {
    "test": {
      "presets": [
        "@babel/preset-react",
      ],
    }
  }
}
