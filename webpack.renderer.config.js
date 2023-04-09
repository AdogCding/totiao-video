const rules = require('./webpack.rules');
const {VueLoaderPlugin} = require("vue-loader");

module.exports = {
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins:[
    new VueLoaderPlugin(),
  ]
};
