const presets = [
  [
    '@babel/env',
    {
      targets: {
        node: '8.10',
      },
      useBuiltIns: 'entry',
      corejs: '2',
    },
  ],
];

module.exports = {
  presets,
  plugins: [
    '@babel/plugin-proposal-object-rest-spread',
  ],
};
