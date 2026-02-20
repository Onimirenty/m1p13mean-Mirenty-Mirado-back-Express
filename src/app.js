const express = require("express");
const app = express();
const routes = require('./routes');


app.use(express.json());
app.use('/palamyre/', routes); // Préfixe global pour l'API

module.exports = app; // On exporte l'app pour server.js