import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import compression from 'compression';
import awsServerlessExpressMiddleware from 'aws-serverless-express/middleware';
import nunjucks from 'nunjucks';
import path from 'path';
import config from './config';

// Create nunjucks fileloader instance for the views folder
const nunjucksFileLoader = new nunjucks.FileSystemLoader(path.join(__dirname, './views'), {
  noCache: true,
});

const env = new nunjucks.Environment(nunjucksFileLoader, {
  autoescape: false,
  web: {
    useCache: false,
  },
});

const app = express();

app.use(compression());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(awsServerlessExpressMiddleware.eventContext());

// Add express to the nunjucks enviroment instance
env.express(app);

// Create a view engine from nunjucks enviroment variable
app.engine('njk', env.render);

// Set the express view engine to the above created view engine
app.set('view engine', 'njk');
app.set('view cache', false);

app.get('/', (req, res) => {
  res.render('index', {
    title: 'DVSA Road Side Payment',
    assets: config.isDevelopment ? '' : config.assets,
  });
});

export default app;
