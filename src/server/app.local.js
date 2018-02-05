import express from 'express';
import app from './app';
import config from './config';

const { port, assets } = config;

app.use(express.static(assets));

app.listen(port, () => {
  console.log(`Listening at: http://localhost:${port}`);
  console.log(`Assets: ${assets}`);
});
