import { body, validationResult } from 'express-validator/check';

// Robots
export const robots = (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /');
};

// Index Route
export const index = (req, res) => {
  const viewData = {
    pageBreadcrumbItems: [
      { text: 'Home', url: '/' },
      { text: 'Payment Code', url: '#' },
    ],
  };

  res.render('payment/index', viewData);
};

const paymentCodeValidationChecks = [
  body('payment-code').trim().not().isEmpty(),
  body('payment-code').trim().isHexadecimal(),
];

export const validatePaymentCode = [
  paymentCodeValidationChecks,
  (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render('payment/index', { invalid: true });
    }
  },
];

