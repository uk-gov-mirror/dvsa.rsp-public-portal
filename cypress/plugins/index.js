const dotenv = require('dotenv');

dotenv.config();

module.exports = () => ({
  baseUrl: process.env.E2E_URL,
  env: {
    paymentCode: process.env.E2E_PAYMENT_CODE,
  },
});
