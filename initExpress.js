const express = require('express');
const cors = require('cors')
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser');
const path = require('path');

module.exports = function(serviceDir){
  const app = express();
  app.engine('mustache', mustacheExpress());
  app.set('view engine', 'mustache');
  app.set('views', path.join(__dirname, './views'));
  app.use(express.static(serviceDir));
  app.use(cors());
  app.use(bodyParser.json()); //数据JSON类型
  app.use(bodyParser.urlencoded({ extended: false }));
  return app;
}
