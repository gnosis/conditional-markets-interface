const path = require("path");

const merge = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
  mode: "development",
  devtool: "eval-source-map",
  devServer: {
    contentBase: path.resolve(__dirname, "assets"),
    proxy: {
      // Needed to proxy whitelist service, as it is blocked by cors/corb
      "/api": {
        target: "https://sight-whitelist.staging.gnosisdev.com",
        pathRewrite: { "/api": "/api/v1" },
        changeOrigin: true,
        secure: false
      }
    },
    overlay: true
  }
});
