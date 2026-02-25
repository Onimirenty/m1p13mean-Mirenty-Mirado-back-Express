const express = require("express");
const app = express();
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const logger = require('./utils/logger')

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

app.use(`/${process.env.NOM_DU_CENTRE_COMMERCIAL}/`, routes); // Préfixe global pour l'API
app.use(errorHandler);

module.exports = app; // On exporte l'app pour server.js