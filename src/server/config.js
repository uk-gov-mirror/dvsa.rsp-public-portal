import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const env = process.env.NODE_ENV || 'development';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const isDevelopment = env === 'development';
const assets = process.env.PUBLIC_ASSETS || path.resolve(__dirname, '..', 'public');
const views = process.env.VIEWS || path.resolve(__dirname, 'views');

const config = {
  env,
  port,
  isDevelopment,
  assets,
  views,
};

export default config;
