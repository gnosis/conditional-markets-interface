module.exports = {
  "presets": [
    "@babel/preset-react",
  ],
  "plugins": [
    "@babel/plugin-syntax-dynamic-import",
    "@babel/plugin-proposal-class-properties"
  ],
  "env": {
    "test": {
      "presets": [
        "@babel/preset-react",
      ],
    }
  }
}