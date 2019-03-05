const HtmlWebpackPlugin = require("html-webpack-plugin");

const publicPath =
  process.env.NODE_ENV === "productionnnnnnnn"
    ? "/hg-first-decentralized-market/"
    : "/";

module.exports = {
  entry: "./src/index.js",
  devtool: "eval-source-map",
  output: {
    path: __dirname + "/../docs",
    publicPath,
    filename: "bundle.js"
  },
  resolve: {
    symlinks: false,
    alias: {
      "~style": `${__dirname}/src/style`,
      "~assets": `${__dirname}/src/assets`
    },
    modules: [
      `${__dirname}/src`,
      `${__dirname}/../package.json`,
      `${__dirname}/../node_modules`
    ]
  },
  devServer: {
    contentBase: __dirname + "/dist"
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules)/,
        use: "babel-loader"
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.scss$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              modules: true,
              localIdentName: "[name]__[local]__[hash:base64:5]",
              importLoaders: 1
            }
          },
          "sass-loader"
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: __dirname + "/src/html/index.html"
    })
  ]
};
