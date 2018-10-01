/* eslint-disable no-multi-spaces */
import dotenv from 'dotenv';
import path from 'path';
import AWS from 'aws-sdk';

dotenv.config();

const metadata = [
  { id: 'clientId',          key: 'CLIENT_ID' },
  { id: 'clientSecret',      key: 'CLIENT_SECRET' },
  { id: 'cpmsServiceUrl',    key: 'CPMS_SERVICE_URL' },
  { id: 'nodeEnv',           key: 'NODE_ENV' },
  { id: 'paymentServiceUrl', key: 'PAYMENT_SERVICE_URL' },
  { id: 'penaltyServiceUrl', key: 'PENALTY_SERVICE_URL' },
  { id: 'publicAssets',      key: 'PUBLIC_ASSETS' },
  { id: 'redirectUrl',       key: 'REDIRECT_URL' },
  { id: 'region',            key: 'REGION' },
  { id: 'urlRoot',           key: 'URL_ROOT' },
];

let configuration = {};
async function bootstrap() {
  return new Promise((resolve, reject) => {
    if (process.env.USE_SECRETS_MANAGER === 'true') {
      const SecretId = process.env.SECRETS_MANAGER_SECRET_NAME;
      console.log(`Pulling config from AWS Secrets Manager for secret ${SecretId}...`);
      const secretsManagerClient = new AWS.SecretsManager({ region: process.env.REGION });
      secretsManagerClient.getSecretValue({ SecretId }, (err, secretsManagerResponse) => {
        if (err) {
          console.log(err);
          reject(err);
        }
        configuration = JSON.parse(secretsManagerResponse.SecretString);
        console.log('Finished fetching config from secrets manager');
        resolve(configuration);
      });
    } else {
      console.log('Using envvars for config');
      configuration = metadata
        .map(c => c.key)
        .reduce((config, key) => ({ [key]: process.env[key], ...config }), configuration);
      console.log('Finished getting envvars');
      resolve(configuration);
    }
  });
}

function value(id) {
  return configuration[id];
}

function ensureRelativeUrl(url) {
  if (!url) {
    return '';
  }

  if (!url.startsWith('/')) {
    return `/${url}`;
  }

  return url;
}

const env = process.env.NODE_ENV || 'development';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const isDevelopment = env === 'development';
const urlRoot = ensureRelativeUrl(process.env.URL_ROOT);
const assets = process.env.PUBLIC_ASSETS || path.resolve(__dirname, '..', 'public');
const views = process.env.VIEWS || path.resolve(__dirname, 'views');
const clientId = process.env.CLIENT_ID || 'client';
const clientSecret = process.env.CLIENT_SECRET || 'secret';
const region = process.env.REGION;
const penaltyServiceUrl = process.env.PENALTY_SERVICE_URL;
const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL;
const cpmsServiceUrl = process.env.CPMS_SERVICE_URL;
const redirectUrl = process.env.REDIRECT_URL;

const config = {
  env,
  port,
  isDevelopment,
  assets,
  views,
  clientId,
  clientSecret,
  urlRoot,
  penaltyServiceUrl,
  paymentServiceUrl,
  cpmsServiceUrl,
  region,
  redirectUrl,
  bootstrap,
  value,
};

export default config;
