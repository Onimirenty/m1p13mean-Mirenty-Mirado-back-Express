const express = require("express");
const app = express();
const routes = require('./routes'); // Importation de vos routes centralisées

// Middlewares globaux (ex: pour lire le JSON)
app.use(express.json());
const errorHandler = require('./middlewares/error.middleware');

// Intégration de vos routes
app.use('/api/v1', routes); // Préfixe global pour l'API

// Route de test simple (peut aussi aller dans routes.js)
app.get("/", (req, res) => {
    res.json("Hello world - API Centre Commercial");
});
app.use(errorHandler);

module.exports = app; // On exporte l'app pour server.js