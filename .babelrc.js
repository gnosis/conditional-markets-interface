module.exports = {
  presets: [
    ["@babel/preset-env", {
      targets: "last 1 version, > 0.25%, not dead"
    }],
    "@babel/preset-react"
  ],
  plugins: ["@babel/plugin-syntax-dynamic-import", "react-hot-loader/babel"],
  env: {
    test: {
      presets: [
        ['@babel/preset-env', {targets: {node: 'current'}}],
        "@babel/preset-react"
      ]
    }
  }
}
