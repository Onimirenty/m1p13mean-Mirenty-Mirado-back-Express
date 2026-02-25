const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger')

const { login,signup,refresh,logout,my_indentity } = require('./auth.controller');

// Route login
router.post('/login', login);
router.post('/signup', signup);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/me', my_indentity);

module.exports = router;

