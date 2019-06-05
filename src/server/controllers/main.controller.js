// Robots
export const robots = (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /');
};

// Index Route
export const index = (req, res) => {
  const language = req.i18n_lang;
  if (language === 'en') {
    return res.redirect('https://www.gov.uk/pay-dvsa-roadside-fine');
  }
  if (language === 'cy') {
    return res.redirect('https://www.gov.uk/talu-dirwy-ymylffordd-dvsa');
  }
  return res.render('main/index');
};
