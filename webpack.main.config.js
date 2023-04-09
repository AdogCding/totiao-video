const webpack = require('webpack')
module.exports = {
    /**
     * This is the main entry point for your application, it's the first file
     * that runs in the main process.
     */
    entry: './src/main/index.js',
    // Put your normal webpack config below here
    module: {
        rules: require('./webpack.rules'),
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.FLUENTFFMPEG_COV': false
        })
    ],
    externals:{
        bufferutil: "bufferutil",
        "utf-8-validate": "utf-8-validate"
    }
};
