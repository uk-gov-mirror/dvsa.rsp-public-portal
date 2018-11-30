/* eslint-disable */

const fs = require('fs-extra');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

function getConfigurationByFile (file) {
  const pathToConfigFile = path.resolve('cypress', 'config', `${file}.json`);

  return fs.readJsonSync(pathToConfigFile);
}

module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config

  return {
    baseUrl: process.env.E2E_URL,
    env: {
      paymentCode: process.env.E2E_PAYMENT_CODE,
      paidPenaltyGroup: process.env.E2E_PAID_PENALTY_GROUP,
      unpaidPenaltyGroup: process.env.E2E_UNPAID_PENALTY_GROUP
    }
  }
};
