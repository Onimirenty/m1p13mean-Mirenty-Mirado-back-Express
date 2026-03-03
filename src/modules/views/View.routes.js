const express = require('express');
const router = express.Router();

const ViewController = require('./View.controller');

// POST /views — accessible connecté et non connecté
router.post('/', ViewController.enregistrerVue);

module.exports = router;
