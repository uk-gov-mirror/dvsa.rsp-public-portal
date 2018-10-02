/* eslint-disable no-multi-spaces */
import dotenv from 'dotenv';
import path from 'path';
import AWS from 'aws-sdk';

dotenv.config();

const configMetadata = {
  clientId: 'CLIENT_ID',
  clientSecret: 'CLIENT_SECRET',
  cpmsServiceUrl: 'CPMS_SERVICE_URL',
  nodeEnv: 'NODE_ENV',
  paymentServiceUrl: 'PAYMENT_SERVICE_URL',
  penaltyServiceUrl: 'PENALTY_SERVICE_URL',
  port: 'PORT',
  publicAssets: 'PUBLIC_ASSETS',
  redirectUrl: 'REDIRECT_URL',
  region: 'REGION',
  urlRoot: 'URL_ROOT',
};

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
        console.log(`Cached ${Object.keys(configuration).length} config items from secrets manager`);
        resolve(configuration);
      });
    } else {
      console.log('Using envvars for config');
      configuration = Object.values(configMetadata)
        .reduce((config, envkey) => ({ [envkey]: process.env[envkey], ...config }), configuration);
      console.log('Finished getting envvars');
      resolve(configuration);
    }
  });
}

function penaltyServiceUrl() {
  return configuration[configMetadata.penaltyServiceUrl];
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

const assets = process.env.PUBLIC_ASSETS || path.resolve(__dirname, '..', 'public');
const views = process.env.VIEWS || path.resolve(__dirname, 'views');
const clientId = process.env.CLIENT_ID || 'client';
const clientSecret = process.env.CLIENT_SECRET || 'secret';
const region = process.env.REGION;
const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL;
const cpmsServiceUrl = process.env.CPMS_SERVICE_URL;
const redirectUrl = process.env.REDIRECT_URL;

function env() {
  return configuration[configMetadata.nodeEnv] || 'development';
}

function isDevelopment() {
  return env() === 'development';
}

function port() {
  const portVar = configuration[configMetadata.port];
  return portVar ? Number(portVar) : 3000;
}

function urlRoot() {
  return ensureRelativeUrl(configuration[configMetadata.urlRoot]);
}

const config = {
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
};

export default config;
