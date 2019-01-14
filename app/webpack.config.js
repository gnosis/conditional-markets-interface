const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/index.js",
  output: {
    path: __dirname + "/dist",
    publicPath: "/",
    filename: "bundle.js"
  },
  devServer: {
    contentBase: __dirname + "/dist"
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: __dirname + "/src/html/index.html"
    })
  ]
};
