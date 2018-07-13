import { check } from 'express-validator/check';

export default [
  // TODO: adjust min to allow for multi penalty payment group
  check('payment_code').isLength({ min: 16, max: 16 }),
  check('payment_code').trim().isHexadecimal(),
];
