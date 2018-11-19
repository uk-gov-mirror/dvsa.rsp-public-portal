import 'babel-polyfill';
import _ from 'lodash';
import nunjucks from 'nunjucks';
import path from 'path';
import resolvePath from 'resolve-path';
import walkSync from 'walk-sync';
import config from './config';

/**
 * Configures file loading and lodash for nunjucks.
 * @returns The nunjucks environment.
 */
export default async () => {
  await config.bootstrap();

  // Create nunjucks fileloader instance for the views folder
  const nunjucksFileLoader = new nunjucks.FileSystemLoader(config.views(), {
    noCache: true,
  });

  const env = new nunjucks.Environment(nunjucksFileLoader, {
    autoescape: false,
    web: {
      useCache: false,
    },
  });

  const marcosPath = path.resolve(config.views(), 'macros');

  // Gets absolute path of each macro file
  const macros = walkSync(marcosPath, { directories: false })
    .map(file => resolvePath(marcosPath, file));

  env.addGlobal('macroFilePaths', macros);
  env.addGlobal('assets', config.isDevelopment() ? '' : config.assets());
  env.addGlobal('urlroot', config.urlRoot());

  // Add lodash as a global for view templates
  env.addGlobal('_', _);

  // Set default language for tests.
  env.addGlobal('clang', 'en');

  return env;
};
