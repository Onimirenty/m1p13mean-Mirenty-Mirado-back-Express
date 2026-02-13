const express = require('express');
const router = express.Router();
const { login } = require('./auth.controller');

// Route login
router.post('/login', login);

module.exports = router;

