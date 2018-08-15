/* eslint-disable */
const path = require('path');
const webpack = require('webpack');
const common = require('./webpack.config.common.babel');
const merge = require('webpack-merge');

module.exports = merge(common, {
  output: {
    filename: '[name].bundle.js',
    path: path.resolve('build', 'public', 'javascripts'),
  },
  watch: false,
  plugins: [
    // More info:
    // https://webpack.js.org/plugins/source-map-dev-tool-plugin/
    new webpack.SourceMapDevToolPlugin(),
  ],
});
