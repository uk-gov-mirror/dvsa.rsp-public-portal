// @ts-check
/* eslint-disable global-require */
import 'babel-polyfill';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import compression from 'compression';
import awsServerlessExpressMiddleware from 'aws-serverless-express/middleware';
import path from 'path';
import errorhandler from 'errorhandler';
import validator from 'express-validator';
import helmet from 'helmet';
import i18n from 'i18n-express';
import cookieParser from 'cookie-parser';
import setupNunjucksEnv from './nunjucksEnv';

export default async () => {
  const app = express();
  const nunjucksEnv = await setupNunjucksEnv();

  app.use(helmet());

  // Add express to the nunjucks enviroment instance
  nunjucksEnv.express(app);
  app.use(cookieParser());

  // Create a view engine from nunjucks enviroment variable
  app.engine('njk', nunjucksEnv.render);

  // Set the express view engine to the above created view engine
  app.set('view engine', 'njk');
  app.set('view cache', false);

  // Disable powered by express in header
  app.set('x-powered-by', false);

  app.use(compression());
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(validator());

  app.use(i18n({
    translationsPath: path.join(__dirname, 'i18n'),
    siteLangs: ['en', 'fr', 'de', 'cy', 'es', 'pl'],
    textsVarName: 't',
    cookieLangName: 'locale',
  }));
  // Make the selected language available globally
  app.use((req, res, next) => {
    let language;

    if (req.query.clang) {
      res.cookie('locale', req.query.clang);
      language = req.query.clang;
    } else if (req.cookies.locale) {
      language = req.cookies.locale;
      req.query.clang = req.cookies.locale;
    }

    nunjucksEnv.addGlobal('clang', language);
    console.log('################## language callback hit. ##################');
    next();
  });
  // Always sanitizes the body
  app.use((req, res, next) => {
    Object.keys(req.body).forEach((item) => {
      req.sanitize(item).escape();
    });
    next();
  });
  app.use(awsServerlessExpressMiddleware.eventContext());
  // Load routes module dynamically to allow config to initialise
  app.use('/', require('./routes'));

  app.use(errorhandler());
  return app;
};
