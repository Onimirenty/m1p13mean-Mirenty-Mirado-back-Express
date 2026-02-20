const express = require('express');
const router = express.Router();
const { login,signup } = require('./auth.controller');

// Route login
router.post('/login', login);
router.post('/signup', signup);

module.exports = router;

