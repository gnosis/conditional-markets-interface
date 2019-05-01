module.exports = {
  "presets": [
    "@babel/preset-react",
  ],
  "plugins": [
    "react-hot-loader/babel",
    "@babel/plugin-syntax-dynamic-import"
  ],
  "env": {
    "test": {
      "presets": [
        "@babel/preset-react",
      ],
    }
  }
}