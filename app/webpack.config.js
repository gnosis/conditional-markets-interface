const path = require("path");
const CommonShakePlugin = require("webpack-common-shake").Plugin;
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

const publicPath =
  process.env.NODE_ENV === "production"
    ? "/hg-first-decentralized-market/"
    : "/";

const moduleStubPath = path.resolve(__dirname, "module-stub.js");

module.exports = {
  entry: "./src/index.js",
  devtool: "eval-source-map",
  output: {
    path: __dirname + "/../docs",
    publicPath,
    filename: "bundle.js"
  },
  target: "web",
  resolve: {
    symlinks: false,
    alias: {
      "~style": `${__dirname}/src/style`,
      // manually deduplicate these modules
      "bn.js": path.resolve(__dirname, "../node_modules/bn.js"),
      // stub out these modules
      "web3-shh": moduleStubPath,
      "web3-bzz": moduleStubPath,
      "web3-eth-ens": moduleStubPath,
      "web3-providers-ipc": moduleStubPath,
      "bignumber.js/bignumber": moduleStubPath
    }
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
      },
      {
        test: /build\/contracts\/\w+\.json$/,
        use: [
          "json-x-loader?exclude=bytecode+deployedBytecode+ast+legacyAST+sourceMap+deployedSourceMap+source+sourcePath+ast+legacyAST+compiler+schemaVersion+updatedAt+devdoc+userdoc"
        ]
      }
    ]
  },
  plugins: [
    new CommonShakePlugin(),
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: __dirname + "/src/html/index.html"
    }),
    new BundleAnalyzerPlugin({
      analyzerPort: process.env.NODE_ENV !== "production" ? 8888 : 8889
    })
  ]
};
