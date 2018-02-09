import { body, validationResult } from 'express-validator/check';

// Robots
export const robots = (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /');
};

// Index Route
export const index = (req, res) => {
  res.render('payment/index');
};

// Removes all non-alphanumeric characters and converts to lowercase
export const normalizePaymentcode = (req, res, next) => {
  req.body['payment-code'] = req.body['payment-code'].replace(/\W|_/g, '').toLowerCase();
  next();
};

export const paymentCodeValidationChecks = [
  body('payment-code').isLength({ min: 16, max: 16 }),
  body('payment-code').trim().isHexadecimal(),
];

export const validatePaymentCode = [
  normalizePaymentcode,
  paymentCodeValidationChecks,
  (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const viewData = {
        invalidPaymentCode: true,
      };
      res.render('payment/index', viewData);
    } else {
      res.redirect(`payment-code/${req.body['payment-code']}`);
    }
  },
];

