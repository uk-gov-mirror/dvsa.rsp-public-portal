import { isNumber } from 'lodash';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import aws4 from 'aws4';
import URL from 'url-parse';

import config from '../config';

export default class SignedHttpClient {
  constructor(baseURL, headers) {
    this.baseUrlOb = new URL(baseURL);
    this.headers = headers;
    this.credentials = {
      clientId: config.clientId(),
      clientSecret: config.clientSecret(),
    };
    this.signingOptions = {
      host: this.baseUrlOb.host,
      region: config.region(),
    };
    axiosRetry(axios);
  }

  get(path) {
    const options = {
      path: `${this.baseUrlOb.pathname}${path}`,
      ...(config.doSignedRequests() ? this.signingOptions : {}),
    };
    if (config.doSignedRequests()) {
      aws4.sign(options, {
        accessKeyId: this.credentials.clientId,
        secretAccessKey: this.credentials.clientSecret,
      });
    }
    return axios.get(`${this.baseUrlOb.href}${path}`, options);
  }

  post(path, data, retryAttempts) {
    const options = {
      body: JSON.stringify(data),
      path: `${this.baseUrlOb.pathname}${path}`,
      headers: {
        'Content-Type': 'application/json',
      },
      ...(config.doSignedRequests() ? this.signingOptions : {}),
    };
    if (config.doSignedRequests()) {
      aws4.sign(options, {
        accessKeyId: this.credentials.clientId,
        secretAccessKey: this.credentials.clientSecret,
      });
    }

    if (isNumber(retryAttempts)) {
      options['axios-retry'] = {
        retries: retryAttempts,
        retryCondition: axiosRetry.isRetryableError,
      };
    }

    return axios.post(`${this.baseUrlOb.href}${path}`, data, options);
  }

  put(path, )
}
