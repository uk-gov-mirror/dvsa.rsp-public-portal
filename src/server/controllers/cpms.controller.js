
// Robots
export const robots = (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /');
};

// Step 1 route
export const step1 = (req, res) => {
  res.render('cpms/cpms-step-1');
};

export const step2 = (req, res) => {
  res.render('cpms/cpms-step-2');
};

export const step3 = (req, res) => {
  res.render('cpms/cpms-step-3');
};
