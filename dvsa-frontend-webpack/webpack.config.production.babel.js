/* eslint-disable */
const path = require('path');
const common = require('./webpack.config.common.babel');
const merge = require('webpack-merge');
const MinifyPlugin = require('babel-minify-webpack-plugin');

module.exports = merge(common, {
  output: {
    filename: '[name].bundle.js',
    path: path.resolve('dist', 'public', 'javascripts'),
  },
  plugins: [
    new MinifyPlugin(),
  ],
});
