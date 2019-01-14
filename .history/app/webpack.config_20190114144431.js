const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: "./src/index.js",
  output: {
    path: __dirname + "/dist",
    publicPath: "/",
    filename: "bundle.js"
  },
  devServer: {
    contentBase: "./dist"
  },
  plugins: [
    new HtmlWebpackPlugin({
        hash: true,
        filename: 'index.html',
        template: __dirname + '/index.html',
    })]
};
