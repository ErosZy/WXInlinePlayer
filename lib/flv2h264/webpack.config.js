var getConfig = require('hjs-webpack');

let config = getConfig({
  in: 'index.js',
  out: 'build',
  clearBeforeBuild: true
});

let jsconf = config.module.rules[0];
delete jsconf.exclude;

config.output.library = 'FLV2H264';
config.output.libraryTarget = 'umd';

module.exports = config;
