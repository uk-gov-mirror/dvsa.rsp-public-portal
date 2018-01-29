/* eslint-disable */
import express from 'express';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import app from './app';
import config from './config';
import webpackConfig from './../../webpack.config';

const compiler = webpack(webpackConfig);

app.use(webpackDevMiddleware(compiler, {
  publicPath: 'public',
}));

const { port, assets } = config;

app.use(express.static(assets));

app.listen(port);
