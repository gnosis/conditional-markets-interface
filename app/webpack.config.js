const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

const moduleStubPath = path.resolve(__dirname, "module-stub.js");

module.exports = {
  entry: "./src/index.js",
  devtool: "eval-source-map",
  output: {
    path: __dirname + "/../docs",
    filename: "bundle.js"
  },
  target: "web",
  resolve: {
    symlinks: false,
    alias: {
      assets: `${__dirname}/assets`,
      scss: `${__dirname}/src/scss`,
      // manually deduplicate these modules
      "bn.js": path.resolve(__dirname, "../node_modules/bn.js"),
      // stub out these modules
      "web3-shh": moduleStubPath,
      "web3-bzz": moduleStubPath,
      "web3-eth-ens": moduleStubPath,
      "web3-providers-ipc": moduleStubPath,
      "bignumber.js/bignumber": moduleStubPath
    },
    modules: ["node_modules", "src", "assets"]
  },
  devServer: {
    contentBase: __dirname + "/assets",
    overlay: true
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules)/,
        use: "babel-loader"
      },
      {
        test: /\.s?css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              modules: {
                localIdentName: "[name]__[local]--[hash:base64:5]"
              }
            }
          },
          "sass-loader"
        ]
      },
      {
        test: /\.woff2?(\?v=\d+\.\d+\.\d+)?$/,
        use: {
          loader: "file-loader",
          options: {
            name: "[name].[ext]",
            outputPath: "fonts/"
          }
        },
        include: [`${__dirname}/assets/fonts`]
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ["file-loader"],
        exclude: [`${__dirname}/assets/icons`]
      },
      {
        test: /.*\/icons\/.*\.svg$/,
        use: {
          loader: "svg-url-loader",
          options: {
            stripdeclarations: true
          }
        }
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
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: __dirname + "/src/index.html"
    })
    /*
    new BundleAnalyzerPlugin({
      analyzerPort: process.env.NODE_ENV !== "production" ? 8888 : 8889
    })
    */
  ]
};
